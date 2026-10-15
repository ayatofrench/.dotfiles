#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifySource } from './pstack-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { lock } = verifySource(root);
console.log(`PASS: source manifest and pstack.lock.json agree at ${lock.revision}.`);
const source = path.join(root, 'reference/pstack/skills');
const names = fs.readdirSync(source).filter(name => fs.existsSync(path.join(source, name, 'SKILL.md')));
assert.equal(names.filter(name => name.startsWith('principle-')).length, 24);
assert.equal(fs.readdirSync(path.join(source, 'poteto-mode/playbooks')).filter(name => name.endsWith('.md')).length, 23);

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? markdownFiles(file) : file.endsWith('.md') ? [file] : [];
  });
}

for (const host of ['pi', 'claude']) {
  const base = path.join(root, host === 'pi' ? '.agents/skills' : '.claude/skills');
  for (const name of names) {
    const local = name.startsWith('principle-') || name.startsWith('poteto-') ? name : `pstack-${name}`;
    const directory = path.join(base, local);
    const skill = fs.readFileSync(path.join(directory, 'SKILL.md'), 'utf8');
    assert.ok(skill.startsWith('---\n'), `${host}/${local}: frontmatter`);
    assert.ok(skill.includes(`name: ${local}\n`), `${host}/${local}: name`);
    assert.ok(/^description: .+/m.test(skill), `${host}/${local}: description`);
    assert.ok(skill.includes('disable-model-invocation: true'), `${host}/${local}: explicit activation`);
    if (!name.startsWith('principle-')) {
      assert.ok(skill.includes(`the ${host} execution contract`), `${host}/${local}: host contract`);
      assert.ok(fs.existsSync(path.join(directory, 'LICENSE.txt')), `${host}/${local}: license`);
    }
    for (const file of markdownFiles(directory)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(link)) continue;
        const [target] = link.split('#');
        assert.ok(fs.existsSync(path.resolve(path.dirname(file), target)), `${file}: broken ${link}`);
      }
    }
  }
  const setupPath = path.join(base, 'pstack-setup-pstack/SKILL.md');
  const nativeSetupPath = path.join(root, 'pstack/hosts', host, 'skills/pstack-setup-pstack/SKILL.md');
  const setup = fs.readFileSync(setupPath, 'utf8');
  assert.equal(setup, fs.readFileSync(nativeSetupPath, 'utf8'), `${host}: native setup survives import unchanged`);
  assert.ok(!setup.includes('pstack-models.mdc'), `${host}: no Cursor setup destination`);
  assert.ok(!setup.includes('PSTACK_CODE_ROLE'), `${host}: no symbolic model defaults in setup`);
  assert.ok(setup.includes('all 17 role entries'), `${host}: complete role inventory`);
  assert.ok(setup.includes('Do not write before confirmation'), `${host}: confirmation gate`);
  assert.ok(setup.includes('without separate permission'), `${host}: no implicit model probes`);
  for (let step = 1; step <= 7; step += 1) {
    assert.ok(setup.includes(`## ${step}. `), `${host}: setup step ${step}`);
  }
  assert.ok(setup.includes(host === 'pi' ? 'Unset does not mean inherit-parent' : 'Opus medium is the current allowed effort'), `${host}: host-specific restrictions`);
  const playbooks = path.join(base, 'poteto-mode/playbooks');
  assert.equal(fs.readdirSync(playbooks).filter(name => name.endsWith('.md')).length, 23);
  for (const name of fs.readdirSync(path.join(source, 'poteto-mode/playbooks'))) {
    assert.ok(fs.existsSync(path.join(playbooks, name)), `${host}: missing ${name}`);
  }
  const policy = fs.readFileSync(path.join(base, 'poteto-mode/MODELS.md'), 'utf8');
  assert.ok(policy.includes(host === 'pi' ? 'unconfigured' : 'Sonnet 5.5'), `${host}: policy`);
}
const commentAgent = fs.readFileSync(path.join(root, 'pstack/hosts/claude/agents/comment-sicko.md'), 'utf8');
const commentHeader = commentAgent.match(/^---\n([\s\S]*?)\n---\n/);
assert.ok(commentHeader, 'Claude Comment Sicko: frontmatter');
const agentFields = Object.fromEntries(commentHeader[1].split('\n').map(line => {
  const separator = line.indexOf(':');
  assert.ok(separator > 0, 'Claude Comment Sicko: simple native field');
  return [line.slice(0, separator), line.slice(separator + 1).trim()];
}));
assert.deepEqual(Object.keys(agentFields).sort(), ['description', 'effort', 'model', 'name', 'tools']);
assert.equal(agentFields.name, 'comment-sicko');
assert.equal(agentFields.model, 'opus');
assert.equal(agentFields.effort, 'medium');
assert.deepEqual(agentFields.tools.split(', '), ['Read', 'Grep', 'Glob']);
assert.ok(commentAgent.includes('Require an explicit repository and file set'), 'Comment Sicko: explicit scope');
assert.ok(commentAgent.includes('zero actual file changes'), 'Comment Sicko: report-only');
assert.ok(commentAgent.includes('this definition is not ready to launch'), 'Comment Sicko: model verification gate');
const commentWorkflow = fs.readFileSync(path.join(root, '.claude/skills/pstack-no-comments/SKILL.md'), 'utf8');
assert.equal(commentWorkflow, fs.readFileSync(path.join(root, 'pstack/hosts/claude/skills/pstack-no-comments/SKILL.md'), 'utf8'));
assert.ok(commentWorkflow.includes('Do not silently replace the agent'), 'Comment review: no silent fallback');
console.log('PASS: native Claude Comment Sicko requests only read/search tools, Opus medium, explicit scope, and report-only review; workflow preserves agent separation.');
console.log('PASS: 24 shared principles, 29 imported skills per host, 23 playbooks per host, contracts, policies, licenses, and local Markdown links.');
console.log('PASS: native setup definitions match maintained overrides, cover seven setup stages, and retain host-specific confirmation and model restrictions.');
console.log('Not tested: model dispatch, live workflow behavior, upstream scripts, external integrations, or autonomous operations.');
