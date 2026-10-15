#!/usr/bin/env node
// Link the portable Pi configuration without running the full Dotbot installer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2] ?? '--check';
if (!['--check', '--apply'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: node scripts/link-pi.mjs [--check|--apply]');
  process.exit(2);
}
const links = [
  ['.pi/agent/agents', 'pi/agent/agents'],
  ['.pi/agent/extensions', 'pi/agent/extensions'],
  ['.pi/agent/prompts', 'pi/agent/prompts'],
  ['.agents/skills', '.agents/skills'],
  ['.pi/agent/settings.json', 'pi/agent/settings.json'],
  ['.pi/agent/package.json', 'pi/agent/package.json'],
  ['.pi/agent/package-lock.json', 'pi/agent/package-lock.json'],
  ['.pi/agent/pi-deep-system.md', 'pi/agent/pi-deep-system.md'],
  ['.pi/agent/mcp.json', 'pi/agent/mcp.json'],
  ['.pi/agent-browser/SKILL.md', 'pi/agent-browser/SKILL.md'],
  ['.pi/agent/vendor/pi-subagent', 'pi/agent/vendor/pi-subagent'],
  ['.pi/agent/bin/subagent', 'pi/agent/vendor/pi-subagent/subagent.ts'],
].map(([destination, source]) => ({ destination: path.join(os.homedir(), destination), source: path.join(root, source) }));

let conflicts = false;
let missing = false;
for (const link of links) {
  if (!fs.existsSync(link.source)) throw new Error(`Missing repository source: ${link.source}`);
  let stat;
  try { stat = fs.lstatSync(link.destination); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!stat) { link.missing = true; missing = true; console.log(`MISSING ${link.destination}`); }
  else if (stat.isSymbolicLink() && path.resolve(path.dirname(link.destination), fs.readlinkSync(link.destination)) === link.source) console.log(`LINKED  ${link.destination}`);
  else { conflicts = true; console.error(`CONFLICT ${link.destination}: preserve and reconcile the existing file or link first.`); }
}
if (conflicts) {
  console.error('No links changed. Move conflicting configurations to a backup and reconcile them before retrying.');
  process.exitCode = 1;
} else if (mode === '--apply') {
  for (const { destination, source, missing } of links) {
    if (!missing) continue;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.symlinkSync(source, destination);
    console.log(`CREATED ${destination}`);
  }
  console.log('Pi links applied. This did not install packages, change PATH, or run model calls.');
} else if (missing) process.exitCode = 1;
