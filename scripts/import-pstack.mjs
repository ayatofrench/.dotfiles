#!/usr/bin/env node
// Regenerate the local trial from the pinned, non-discoverable source tree.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptClaudeMarkdown } from './pstack-claude-adapter.mjs';
import { verifySource } from './pstack-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'reference/pstack');
const { lock } = verifySource(root);
const revision = lock.revision;
const skills = fs.readdirSync(path.join(source, 'skills')).filter(name =>
  fs.existsSync(path.join(source, 'skills', name, 'SKILL.md')));
const localName = name => name.startsWith('principle-') || name.startsWith('poteto-')
  ? name : `pstack-${name}`;
const license = fs.readFileSync(path.join(source, 'LICENSE'), 'utf8');

function visit(directory, operation) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(target, operation);
    else operation(target);
  }
}

// Principles are shared, but still regenerate from the accepted source revision.
for (const name of skills.filter(name => name.startsWith('principle-'))) {
  const target = path.join(root, '.agents/skills', name);
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(path.join(source, 'skills', name), target, { recursive: true });
  visit(target, file => {
    if (!file.endsWith('.md')) return;
    const relative = path.relative(target, file);
    const text = fs.readFileSync(file, 'utf8').replace(/\]\(([^)]+)\)/g, (match, link) => {
      if (/^(https?:|mailto:|#)/.test(link) || fs.existsSync(path.resolve(path.dirname(file), link.split('#')[0]))) return match;
      const upstream = path.posix.normalize(path.posix.join('skills', name, path.dirname(relative), link));
      return `](https://github.com/cursor/plugins/blob/${revision}/pstack/${upstream})`;
    });
    fs.writeFileSync(file, text);
  });
  fs.writeFileSync(path.join(target, 'LICENSE.txt'), license);
}

for (const host of ['pi', 'claude']) {
  const destination = path.join(root, host === 'pi' ? '.agents/skills' : '.claude/skills');
  for (const name of skills) {
    if (name.startsWith('principle-')) continue;
    const target = path.join(destination, localName(name));
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(path.join(source, 'skills', name), target, { recursive: true });
    visit(target, file => {
      if (!file.endsWith('.md')) return;
      let text = fs.readFileSync(file, 'utf8');
      for (const skill of [...skills].sort((a, b) => b.length - a.length)) {
        const renamed = localName(skill);
        if (renamed === skill) continue;
        text = text.replaceAll(`../${skill}/`, `../${renamed}/`);
        text = text.replace(new RegExp(`/${skill}(?=[\\s\x60.,;:)]|$)`, 'g'), `/${renamed}`);
      }
      // Symbolic roles are resolved only by the host policy, never passed as model IDs.
      text = text.replaceAll('grok-4.7-xhigh-fast', 'PSTACK_CODE_ROLE')
        .replaceAll('claude-opus-5-5-xhigh', 'PSTACK_JUDGMENT_ROLE');
      const relativePath = path.relative(target, file);
      if (host === 'claude' && fs.existsSync(path.join(source, 'skills', name, relativePath))) {
        text = adaptClaudeMarkdown(text, name, relativePath);
      }
      if (path.basename(file) === 'SKILL.md') {
        text = text.replace(/^name:.*$/m, `name: ${localName(name)}`);
        text = text.replace(/^disable-model-invocation:.*\n/m, '');
        text = text.replace(/^(---\n[\s\S]*?)(\n---\n)/,
          '$1\ndisable-model-invocation: true$2');
        const contract = name === 'poteto-mode' ? 'HARNESS.md' : '../poteto-mode/HARNESS.md';
        text = text.replace(/^(---\n[\s\S]*?\n---\n)/,
          `$1\nRead [the ${host} execution contract](${contract}) before following this skill. It replaces incompatible upstream execution instructions below.\n`);
      }
      fs.writeFileSync(file, text);
    });
    // Host-owned definitions replace generated content after upstream transforms.
    const override = path.join(root, 'pstack/hosts', host, 'skills', localName(name));
    const hasOverride = fs.existsSync(override);
    if (hasOverride) fs.cpSync(override, target, { recursive: true });
    fs.writeFileSync(path.join(target, 'LICENSE.txt'), license);
    fs.writeFileSync(path.join(target, 'PORT-NOTICE.md'),
      `# Local trial port\n\nSource: cursor/plugins pstack at ${revision}.\n\nCopyright (c) 2026 Lauren Tan. MIT License; see LICENSE.txt.\n\n${hasOverride ? `This skill uses a maintained native ${host} definition from pstack/hosts/${host}/skills/${localName(name)}. The unmodified upstream procedure remains in reference/pstack/.` : `The upstream prose is retained with local skill names, symbolic model roles, and a ${host} execution contract.`} This is a broad experimental import, not a claim that every integration works. Bundled scripts have not been approved for execution.\n`);
  }
}
// Guide links outside the imported skill tree open the pinned public source.
// Keep local workflow and sibling-skill links local whenever the file exists.
for (const host of ['pi', 'claude']) {
  const destination = path.join(root, host === 'pi' ? '.agents/skills' : '.claude/skills');
  for (const name of skills.filter(name => !name.startsWith('principle-'))) {
    const target = path.join(destination, localName(name));
    visit(target, file => {
      if (!file.endsWith('.md')) return;
      const relative = path.relative(target, file);
      const upstreamFile = path.posix.join('skills', name, relative);
      let text = fs.readFileSync(file, 'utf8');
      text = text.replace(/\]\(([^)]+)\)/g, (match, link) => {
        if (/^(https?:|mailto:|#)/.test(link)) return match;
        const [localPath] = link.split('#');
        if (fs.existsSync(path.resolve(path.dirname(file), localPath))) return match;
        let original = link;
        for (const skill of skills) original = original.replaceAll(`/${localName(skill)}/`, `/${skill}/`);
        const upstream = path.posix.normalize(path.posix.join(path.posix.dirname(upstreamFile), original));
        return `](https://github.com/cursor/plugins/blob/${revision}/pstack/${upstream})`;
      });
      fs.writeFileSync(file, text);
    });
  }
}
console.log(`Imported ${skills.filter(name => !name.startsWith('principle-')).length} skills per host; 24 principles remain shared.`);
