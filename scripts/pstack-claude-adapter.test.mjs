import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { adaptClaudeMarkdown } from './pstack-claude-adapter.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function source(skill, relative = 'SKILL.md') {
  return fs.readFileSync(path.join(root, 'reference/pstack/skills', skill, relative), 'utf8')
    .replaceAll('grok-4.7-xhigh-fast', 'PSTACK_CODE_ROLE')
    .replaceAll('claude-opus-5-5-xhigh', 'PSTACK_JUDGMENT_ROLE');
}

test('how uses native Agent and preserves investigation structure', () => {
  const result = adaptClaudeMarkdown(source('how'), 'how', 'SKILL.md');
  assert.ok(result.includes('native Agent tool'));
  assert.ok(!result.includes('readonly: true'));
  assert.ok(!result.includes('pstack-models.mdc'));
  for (const heading of ['## 1. Assess complexity', '## 2. Explore', '## 3. Synthesize', '## 4.']) {
    assert.ok(result.includes(heading), heading);
  }
  assert.ok(result.includes('never silently'));
});

test('mode uses native questions and role policy without Cursor defaults', () => {
  const result = adaptClaudeMarkdown(source('poteto-mode'), 'poteto-mode', 'SKILL.md');
  assert.ok(result.includes('AskUserQuestion'));
  assert.ok(result.includes('**Defaults for every `Agent` call.**'));
  assert.ok(result.includes('On Claude versions without per-invocation effort'));
  assert.ok(!result.includes('PSTACK_CODE_ROLE'));
  assert.ok(!result.includes('AskQuestion'));
  assert.ok(result.includes('## Principles'));
  assert.ok(result.includes('## Playbooks'));
});

test('swarm uses local native workers without cloud parameters', () => {
  const result = adaptClaudeMarkdown(source('swarm'), 'swarm', 'SKILL.md');
  assert.ok(result.includes('Jujutsu workspaces'));
  assert.ok(!result.includes('environment:'));
  assert.ok(!result.includes('cloud_base_branch'));
  assert.ok(result.includes('## Phase C: Aggregate'));
  assert.ok(result.includes('A gap does not count as a pass'));
});

test('interrogate does not silently fall back after a rejected model', () => {
  const result = adaptClaudeMarkdown(source('interrogate'), 'interrogate', 'SKILL.md');
  assert.ok(!result.includes("family's table default"));
  assert.ok(!result.includes('Omit `model`'));
  assert.ok(result.includes('Do not silently substitute another model or effort'));
  assert.ok(result.includes('## Step 5, Lead Judgment'));
});

test('why keeps MCP evidence coverage without Cursor readonly assumptions', () => {
  const result = adaptClaudeMarkdown(source('why'), 'why', 'SKILL.md');
  assert.ok(result.includes('ToolSearch'));
  assert.ok(!result.includes('mcps/'));
  assert.ok(!result.includes('`readonly: false`'));
  assert.ok(result.includes('7. Product analytics warehouse'));
  assert.ok(result.includes('## Common Failure Modes to Avoid'));
});

test('help distinguishes native scheduling from mode persistence', () => {
  const result = adaptClaudeMarkdown(source('poteto-help'), 'poteto-help', 'SKILL.md');
  assert.ok(!result.includes('/add-plugin'));
  assert.ok(result.includes('/loop` is a native Claude scheduling skill'));
  assert.ok(result.includes('not a Cursor Custom Mode'));
  assert.ok(result.includes('## Pick a skill'));
});

test('native skill destinations replace Cursor project destinations', () => {
  const result = adaptClaudeMarkdown(source('create-verification-skill'), 'create-verification-skill', 'SKILL.md');
  assert.ok(result.includes('.claude/skills/verify-'));
  assert.ok(!result.includes('.cursor/skills/'));
});

test('all 23 playbooks retain their numbered step sequence', () => {
  const directory = path.join(root, 'reference/pstack/skills/poteto-mode/playbooks');
  const files = fs.readdirSync(directory).filter(name => name.endsWith('.md'));
  assert.equal(files.length, 23);
  for (const name of files) {
    const original = source('poteto-mode', `playbooks/${name}`);
    const result = adaptClaudeMarkdown(original, 'poteto-mode', `playbooks/${name}`);
    assert.deepEqual([...result.matchAll(/^\d+\. /gm)].map(match => match[0]), [...original.matchAll(/^\d+\. /gm)].map(match => match[0]), name);
    assert.ok(!result.includes('AskQuestion'), name);
    assert.ok(!result.includes('PSTACK_CODE_ROLE'), name);
  }
});

test('external bot integration is preserved rather than falsely translated', () => {
  const original = source('make-bot-ui');
  assert.equal(adaptClaudeMarkdown(original, 'make-bot-ui', 'SKILL.md'), original);
});
