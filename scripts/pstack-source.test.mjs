import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { repository, subtree, snapshot, makeLock, verifySource, changes, acceptSource, assertRevision, validateArchiveListing } from './pstack-source.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pstack-source-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const source = path.join(root, 'reference/pstack');
  fs.mkdirSync(path.join(source, 'skills/poteto-mode'), { recursive: true });
  fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT\n');
  fs.writeFileSync(path.join(source, 'skills/poteto-mode/SKILL.md'), '# Original workflow\n');
  const tree = snapshot(source);
  const revision = 'a'.repeat(40);
  fs.writeFileSync(path.join(root, 'pstack.lock.json'), JSON.stringify(makeLock(revision, tree)));
  fs.writeFileSync(path.join(root, 'reference/pstack-source.json'), JSON.stringify({ repository, subtree, revision, files: tree.files }));
  const candidate = path.join(root, 'candidate');
  fs.cpSync(source, candidate, { recursive: true });
  fs.writeFileSync(path.join(candidate, 'skills/poteto-mode/SKILL.md'), '# Updated workflow\n');
  const proposal = { baseRevision: revision, baseIntegrity: tree.integrity, revision: 'b'.repeat(40), integrity: snapshot(candidate).integrity };
  return { root, source, candidate, proposal };
}

test('lock verifies the exact source and detects extra or changed files', t => {
  const { root, source } = fixture(t);
  assert.equal(verifySource(root).lock.fileCount, 2);
  fs.writeFileSync(path.join(source, 'extra.md'), 'local edit');
  assert.throws(() => verifySource(root), /differs from its lock/);
});
test('manifest mismatch is rejected even when the content lock is valid', t => {
  const { root } = fixture(t);
  const file = path.join(root, 'reference/pstack-source.json');
  const manifest = JSON.parse(fs.readFileSync(file));
  manifest.revision = 'c'.repeat(40);
  fs.writeFileSync(file, JSON.stringify(manifest));
  assert.throws(() => verifySource(root), /manifest and lock disagree/);
});
test('diff summary distinguishes additions, modifications, and removals', () => {
  assert.deepEqual(changes({ files: [{ path: 'old', sha256: 'a' }, { path: 'change', sha256: 'a' }] }, { files: [{ path: 'new', sha256: 'b' }, { path: 'change', sha256: 'b' }] }), { added: ['new'], modified: ['change'], removed: ['old'] });
});
test('accept updates the source, manifest, and lock but not live skills', t => {
  const { root, candidate, proposal } = fixture(t);
  fs.mkdirSync(path.join(root, '.claude/skills'), { recursive: true });
  const live = path.join(root, '.claude/skills/local.md');
  fs.writeFileSync(live, 'Keep local configuration');
  acceptSource(root, candidate, proposal);
  assert.equal(verifySource(root).lock.revision, proposal.revision);
  assert.equal(fs.readFileSync(live, 'utf8'), 'Keep local configuration');
});
test('stale stages and post-review source edits cannot be accepted', t => {
  const { root, candidate, proposal } = fixture(t);
  assert.throws(() => acceptSource(root, candidate, { ...proposal, baseRevision: 'c'.repeat(40) }), /stale/);
  fs.writeFileSync(path.join(candidate, 'LICENSE'), 'changed after review');
  assert.throws(() => acceptSource(root, candidate, proposal), /changed after review/);
  assert.equal(verifySource(root).lock.revision, 'a'.repeat(40));
});
test('local source edits block acceptance without losing edits', t => {
  const { root, source, candidate, proposal } = fixture(t);
  fs.writeFileSync(path.join(source, 'LICENSE'), 'local edits');
  assert.throws(() => acceptSource(root, candidate, proposal), /differs from its lock/);
  assert.equal(fs.readFileSync(path.join(source, 'LICENSE'), 'utf8'), 'local edits');
});
test('accept rolls back a failed metadata write', t => {
  const { root, candidate, proposal } = fixture(t);
  const original = fs.writeFileSync;
  let injected = false;
  t.mock.method(fs, 'writeFileSync', (file, ...args) => {
    if (file === path.join(root, 'pstack.lock.json') && !injected) {
      injected = true;
      throw new Error('simulated write failure');
    }
    return original(file, ...args);
  });
  assert.throws(() => acceptSource(root, candidate, proposal), /simulated write failure/);
  assert.equal(verifySource(root).lock.revision, 'a'.repeat(40));
});
test('concurrent acceptance is blocked without removing another writer guard', t => {
  const { root, candidate, proposal } = fixture(t);
  const guard = path.join(root, 'reference/.pstack-update.lock');
  fs.mkdirSync(guard);
  assert.throws(() => acceptSource(root, candidate, proposal), /EEXIST/);
  assert.ok(fs.existsSync(guard));
});
test('source symlinks and unsafe revision arguments are rejected', t => {
  const { root, source } = fixture(t);
  fs.symlinkSync(source, path.join(root, 'linked-source'));
  assert.throws(() => snapshot(path.join(root, 'linked-source')), /real source directory/);
  fs.symlinkSync(path.join(source, 'LICENSE'), path.join(source, 'linked-license'));
  assert.throws(() => snapshot(source), /symlinks are not supported/);
  for (const revision of ['main', '../escape', '-option', 'a'.repeat(39), 'A'.repeat(40)]) assert.throws(() => assertRevision(revision), /40-character/);
});
test('archive validation accepts only scoped regular files and directories', () => {
  assert.doesNotThrow(() => validateArchiveListing('plugins-sha/pstack/\nplugins-sha/pstack/LICENSE\n', 'drwxr-xr-x folder\n-rw-r--r-- file\n', 'plugins-sha/pstack/'));
});
test('archive validation rejects traversal, unscoped paths, and empty listings', () => {
  for (const name of ['', '/etc/passwd', 'other/pstack/LICENSE', 'plugins-sha/pstack/../escape', 'plugins-sha/pstack/dir\\escape']) {
    assert.throws(() => validateArchiveListing(name, '-rw-r--r-- file', 'plugins-sha/pstack/'), /Unsafe/);
  }
});
test('archive validation rejects symlinks, hard links, and special entries', () => {
  for (const type of ['l', 'h', 'b', 'c', 'p', 's', '']) assert.throws(() => validateArchiveListing('plugins-sha/pstack/LICENSE', `${type} entry`, 'plugins-sha/pstack/'), /links or special files/);
});

test('CLI apply requires an explicit reviewed revision and makes no changes', () => {
  const result = spawnSync(process.execPath, [new URL('./update-pstack.mjs', import.meta.url).pathname, 'apply'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /explicit --revision/);
});
