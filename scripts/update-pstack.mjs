#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertRevision, snapshot, verifySource, changes, acceptSource, sha256, validateArchiveListing } from './pstack-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.join(root, '.cache/pstack-updates');
const usage = `Usage: node scripts/update-pstack.mjs <check|stage|apply> [--revision <40-character SHA>]

check  Resolve the latest commit touching pstack on the locked ref. No writes.
stage  Download a candidate and write its source diff to .cache/pstack-updates/.
apply  Accept the staged --revision into reference/pstack and pstack.lock.json.
       Does NOT regenerate or install live skills. Review, then run the importer.

Exit codes: 0 success/current, 1 check found a new revision, 2 error.
No upstream code is executed. No VCS commands, commits, or pushes are performed.`;

async function response(url) {
  const headers = { 'User-Agent': 'dotfiles-pstack-updater', Accept: 'application/vnd.github+json' };
  if (url.startsWith('https://api.github.com/') && process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const result = await fetch(url, { headers, signal: AbortSignal.timeout(120000) });
  if (!result.ok) throw new Error(`Upstream fetch failed: HTTP ${result.status} at ${url}`);
  return result;
}
async function latest(ref) {
  const commits = await (await response(`https://api.github.com/repos/cursor/plugins/commits?path=pstack&sha=${encodeURIComponent(ref)}&per_page=1`)).json();
  if (!Array.isArray(commits) || !commits.length) throw new Error('No upstream pstack commit found.');
  return assertRevision(commits[0].sha);
}
function command(program, args) {
  const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${program} failed: ${result.stderr}`);
  return result.stdout;
}
function realDirectory(directory) {
  if (!fs.lstatSync(directory).isDirectory() || fs.lstatSync(directory).isSymbolicLink()) throw new Error(`Expected a real directory: ${directory}`);
}
async function stage(revision, lock, tree) {
  fs.mkdirSync(cache, { recursive: true });
  realDirectory(cache);
  const destination = path.join(cache, revision);
  if (fs.existsSync(destination)) throw new Error(`Stage already exists: ${destination}. Review it or remove that candidate directory before restaging.`);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pstack-update-'));
  try {
    const archive = path.join(temp, 'source.tar.gz');
    const bytes = Buffer.from(await (await response(`https://codeload.github.com/cursor/plugins/tar.gz/${revision}`)).arrayBuffer());
    fs.writeFileSync(archive, bytes);
    const prefix = `plugins-${revision}/pstack/`;
    const names = command('tar', ['--list', '--gzip', '--file', archive, prefix]);
    const listing = command('tar', ['--list', '--verbose', '--gzip', '--file', archive, prefix]);
    validateArchiveListing(names, listing, prefix);
    const candidate = path.join(temp, 'candidate');
    fs.mkdirSync(candidate);
    command('tar', ['--extract', '--gzip', '--file', archive, '--directory', candidate, '--strip-components=2', '--no-same-owner', '--no-same-permissions', prefix]);
    const next = snapshot(candidate);
    const diff = spawnSync('diff', ['--recursive', '--unified', '--new-file', path.join(root, 'reference/pstack'), candidate], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (diff.error) throw diff.error;
    if (![0, 1].includes(diff.status)) throw new Error(`Cannot produce source diff: ${diff.stderr}`);
    const review = path.join(temp, 'review');
    fs.mkdirSync(review);
    fs.renameSync(candidate, path.join(review, 'source'));
    const proposal = { baseRevision: lock.revision, baseIntegrity: lock.integrity, revision, integrity: next.integrity, archiveSha256: sha256(bytes), changes: changes(tree, next) };
    fs.writeFileSync(path.join(review, 'proposal.json'), JSON.stringify(proposal, null, 2) + '\n');
    const patch = diff.stdout.replaceAll(path.join(root, 'reference/pstack'), 'upstream-before').replaceAll(candidate, 'upstream-after');
    fs.writeFileSync(path.join(review, 'upstream.patch'), patch);
    // Copy before the final rename because the OS temporary directory may be
    // on another filesystem. A partial staging directory is never accepted.
    const pending = fs.mkdtempSync(path.join(cache, '.pending-'));
    try {
      fs.cpSync(review, pending, { recursive: true });
      fs.renameSync(pending, destination);
    } finally { fs.rmSync(pending, { recursive: true, force: true }); }
    console.log(JSON.stringify({ staged: destination, ...proposal }, null, 2));
    console.log('Review upstream.patch and proposal.json. Nothing was installed or accepted.');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}

async function main() {
  const [operation, ...args] = process.argv.slice(2);
  if (operation === '--help' || !operation) { console.log(usage); return; }
  if (!['check', 'stage', 'apply'].includes(operation)) throw new Error(usage);
  if (args.length && (args.length !== 2 || args[0] !== '--revision')) throw new Error(usage);
  const explicit = args.length ? assertRevision(args[1]) : undefined;
  if (operation === 'apply' && !explicit) throw new Error('apply requires an explicit --revision from a reviewed stage.');
  const { lock, tree } = verifySource(root);
  const revision = explicit ?? await latest(lock.ref);
  if (operation === 'check') {
    const changed = revision !== lock.revision;
    console.log(JSON.stringify({ current: lock.revision, candidate: revision, changed, compare: `https://github.com/cursor/plugins/compare/${lock.revision}...${revision}` }, null, 2));
    process.exitCode = changed ? 1 : 0;
  } else if (operation === 'stage') {
    await stage(revision, lock, tree);
  } else {
    realDirectory(cache);
    const directory = path.join(cache, revision);
    realDirectory(directory);
    const proposal = JSON.parse(fs.readFileSync(path.join(directory, 'proposal.json'), 'utf8'));
    if (proposal.revision !== revision) throw new Error('Staged revision does not match the requested revision.');
    acceptSource(root, path.join(directory, 'source'), proposal);
    console.log(`Accepted ${revision}. Source and lock updated; live skills unchanged.\nReview adapter changes, then explicitly run:\n  node scripts/import-pstack.mjs\n  node --test scripts/pstack-claude-adapter.test.mjs\n  node scripts/check-pstack-port.mjs\nUse jj diff to review the generated changes. No commit was created.`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 2; });
