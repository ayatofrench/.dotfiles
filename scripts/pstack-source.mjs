import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const repository = 'https://github.com/cursor/plugins';
export const subtree = 'pstack';
export const sha256 = content => createHash('sha256').update(content).digest('hex');
export function assertRevision(revision) {
  if (typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision)) throw new Error('Expected a full 40-character commit revision.');
  return revision;
}

export function snapshot(directory) {
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Expected a real source directory: ${directory}`);
  const files = [];
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const file = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Source symlinks are not supported: ${file}`);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) files.push({ path: path.relative(directory, file).split(path.sep).join('/'), sha256: sha256(fs.readFileSync(file)) });
      else throw new Error(`Unsupported source entry: ${file}`);
    }
  }
  visit(directory);
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  return { integrity: `sha256:${sha256(JSON.stringify(files))}`, files };
}

export function validateArchiveListing(names, verbose, prefix) {
  const paths = names.trim().split('\n');
  if (paths.some(file => !file.startsWith(prefix) || file.split('/').includes('..') || file.includes('\\'))) throw new Error('Unsafe upstream archive paths.');
  if (verbose.trim().split('\n').some(line => !['d', '-'].includes(line[0]))) throw new Error('Upstream archive includes links or special files; manual review required.');
}

export function makeLock(revision, tree, ref = 'main') {
  return { version: 1, repository, subtree, ref, revision: assertRevision(revision), integrity: tree.integrity, fileCount: tree.files.length };
}
export function readLock(root) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'pstack.lock.json'), 'utf8'));
  if (lock.version !== 1 || lock.repository !== repository || lock.subtree !== subtree || typeof lock.ref !== 'string' || !lock.ref || !/^sha256:[a-f0-9]{64}$/.test(lock.integrity) || !Number.isSafeInteger(lock.fileCount) || lock.fileCount < 1) throw new Error('Invalid pstack.lock.json.');
  assertRevision(lock.revision);
  return lock;
}
export function verifySource(root) {
  const lock = readLock(root);
  const tree = snapshot(path.join(root, 'reference/pstack'));
  if (tree.integrity !== lock.integrity || tree.files.length !== lock.fileCount) throw new Error('Pinned pstack source differs from its lock. Preserve or revert local source edits before proceeding.');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'reference/pstack-source.json'), 'utf8'));
  const files = [...manifest.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (manifest.revision !== lock.revision || manifest.repository !== repository || manifest.subtree !== subtree || JSON.stringify(files) !== JSON.stringify(tree.files)) throw new Error('pstack source manifest and lock disagree.');
  return { lock, tree };
}
export function changes(before, after) {
  const previous = new Map(before.files.map(file => [file.path, file.sha256]));
  const current = new Map(after.files.map(file => [file.path, file.sha256]));
  return {
    added: [...current.keys()].filter(file => !previous.has(file)),
    modified: [...current.keys()].filter(file => previous.has(file) && current.get(file) !== previous.get(file)),
    removed: [...previous.keys()].filter(file => !current.has(file)),
  };
}

// Applying updates only changes the vendored source, manifest, and lock. Host
// regeneration is a separate, explicit operation because it affects live skills.
export function acceptSource(root, candidate, proposal) {
  const guard = path.join(root, 'reference/.pstack-update.lock');
  fs.mkdirSync(guard); // Exclusive writer guard; never remove another process's guard.
  try { return acceptUnlocked(root, candidate, proposal); }
  finally { fs.rmdirSync(guard); }
}
function acceptUnlocked(root, candidate, proposal) {
  const { lock } = verifySource(root);
  assertRevision(proposal.revision);
  if (proposal.baseRevision !== lock.revision || proposal.baseIntegrity !== lock.integrity) throw new Error('Staged update is stale. Stage it again against the current lock.');
  const tree = snapshot(candidate);
  if (tree.integrity !== proposal.integrity) throw new Error('Staged source changed after review. Stage it again.');
  for (const file of ['LICENSE', 'skills/poteto-mode/SKILL.md']) if (!fs.existsSync(path.join(candidate, file))) throw new Error(`Missing required upstream file: ${file}`);
  const backup = fs.mkdtempSync(path.join(root, 'reference/.pstack-update-'));
  const source = path.join(root, 'reference/pstack');
  const lockPath = path.join(root, 'pstack.lock.json');
  const manifestPath = path.join(root, 'reference/pstack-source.json');
  const oldLock = fs.readFileSync(lockPath);
  const oldManifest = fs.readFileSync(manifestPath);
  let moved = false;
  let cleanup = false;
  try {
    fs.cpSync(candidate, path.join(backup, 'next'), { recursive: true });
    fs.renameSync(source, path.join(backup, 'previous'));
    moved = true;
    fs.renameSync(path.join(backup, 'next'), source);
    fs.writeFileSync(manifestPath, JSON.stringify({ repository, revision: proposal.revision, subtree, files: tree.files }, null, 2) + '\n');
    fs.writeFileSync(lockPath, JSON.stringify(makeLock(proposal.revision, tree, lock.ref), null, 2) + '\n');
    cleanup = true;
  } catch (error) {
    if (moved) {
      fs.rmSync(source, { recursive: true, force: true });
      fs.renameSync(path.join(backup, 'previous'), source);
    }
    fs.writeFileSync(lockPath, oldLock);
    fs.writeFileSync(manifestPath, oldManifest);
    cleanup = true;
    throw error;
  } finally {
    if (cleanup) fs.rmSync(backup, { recursive: true, force: true });
    else console.error(`Update interrupted; recovery data retained at ${backup}`);
  }
}
