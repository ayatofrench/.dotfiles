import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function temporaryHome(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-links-test-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}
function link(home, mode) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/link-pi.mjs'), mode], { env: { ...process.env, HOME: home }, encoding: 'utf8' });
}
test('vendored Rex fork matches every locked source file', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'pi/subagent.lock.json'), 'utf8'));
  assert.equal(lock.version, 1);
  assert.equal(lock.repository, 'https://github.com/ayatofrench/pi-subagent');
  assert.match(lock.revision, /^[a-f0-9]{40}$/);
  assert.ok(lock.files.length > 0);
  for (const file of lock.files) {
    assert.ok(!path.isAbsolute(file.path) && !file.path.split('/').includes('..'));
    const bytes = fs.readFileSync(path.join(root, 'pi/agent/vendor/pi-subagent', file.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
  }
});
test('settings load the portable fork and disable the competing subagent extension', () => {
  const settings = JSON.parse(fs.readFileSync(path.join(root, 'pi/agent/settings.json'), 'utf8'));
  assert.ok(settings.packages.includes('./vendor/pi-subagent'));
  assert.ok(!settings.packages.some(item => typeof item === 'string' && item.includes('~/git/')));
  assert.ok(settings.extensions.includes('-extensions/subagent/index.ts'));
  assert.ok(!settings.extensions.includes('+extensions/subagent/index.ts'));
});
test('read-only link check does not create files', t => {
  const home = temporaryHome(t);
  const result = link(home, '--check');
  assert.equal(result.status, 1, result.stderr);
  assert.deepEqual(fs.readdirSync(home), []);
});
test('link apply creates a usable package and CLI and is idempotent', t => {
  const home = temporaryHome(t);
  const result = link(home, '--apply');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.realpathSync(path.join(home, '.pi/agent/vendor/pi-subagent')), path.join(root, 'pi/agent/vendor/pi-subagent'));
  assert.equal(fs.realpathSync(path.join(home, '.pi/agent/bin/subagent')), path.join(root, 'pi/agent/vendor/pi-subagent/subagent.ts'));
  assert.equal(link(home, '--apply').status, 0);
  assert.equal(link(home, '--check').status, 0);
});
test('one conflicting config prevents all link creation and preserves its content', t => {
  const home = temporaryHome(t);
  fs.mkdirSync(path.join(home, '.pi/agent'), { recursive: true });
  const settings = path.join(home, '.pi/agent/settings.json');
  fs.writeFileSync(settings, 'local settings');
  const result = link(home, '--apply');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /CONFLICT/);
  assert.equal(fs.readFileSync(settings, 'utf8'), 'local settings');
  assert.equal(fs.existsSync(path.join(home, '.pi/agent/prompts')), false);
});
