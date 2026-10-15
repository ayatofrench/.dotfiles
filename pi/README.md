# Pi dotfiles

This subtree documents Pi config and custom code managed from `~/.dotfiles` and linked into the live user config directories by Dotbot.

## Managed by Dotbot
- `pi/agent/agents/`
- `pi/agent/extensions/`
- `pi/agent/prompts/`
- `.agents/skills/`
- `pi/agent/settings.json`
- `pi/agent/package.json`
- `pi/agent/package-lock.json`
- `pi/agent/pi-deep-system.md`
- `pi/agent/mcp.json` (configuration only; authentication stays local)
- `pi/agent/vendor/pi-subagent/` and its `~/.pi/agent/bin/subagent` CLI link
- `pi/agent-browser/SKILL.md`

## Copied, not linked yet
- `pi/agent/models.json`
- `pi/agent/trust.json`
- `pi/agent/scripts/`

## Kept local-only in `~/.pi`
- `~/.pi/agent/auth.json`
- `~/.pi/agent/mcp-cache.json`
- `~/.pi/agent/mcp-npx-cache.json`
- runtime state under `~/.pi/agent/.pi/`

## Notes
- Poteto Mode is available as `/poteto-mode` through a Pi prompt template, or as `/skill:poteto-mode` through the shared skill.
- Subagents use the pinned Rex fork in `pi/agent/vendor/pi-subagent`, not an external `~/git` checkout. `pi/subagent.lock.json` records the published fork revision and every source-file hash. The custom `extensions/subagent/index.ts` is explicitly disabled, not deleted. Never load both implementations.
- The managed CLI link `~/.pi/agent/bin/subagent` points to the vendored `subagent.ts`. Keep that bin directory on `PATH`. Rex and Node.js 22.19 or later are required.
- Extension and skill helper dependencies are installed with Dotbot shell hooks via `npm ci`.
- MCP uses Pi's built-in support. `mcp.json` is linked and contains the native `mcpServers` configuration. Existing copied files must be backed up and reconciled before linking.

## Set up another machine

After obtaining this repository at `~/.dotfiles`, install Pi, Rex, Node.js 22.19 or later, and npm. Then run:

```bash
cd ~/.dotfiles
node scripts/link-pi.mjs --check
node scripts/link-pi.mjs --apply
```

The linker refuses to replace existing files, directories, or different links. Back up and reconcile each reported conflict, then retry. It checks all destinations before creating links. It does not run the full Dotbot installer, whose shell hooks have unrelated operations.

Install dependencies for the repository-managed helpers:

```bash
npm --prefix pi/agent ci
npm --prefix pi/agent/extensions/web-tools ci
npm --prefix pi/agent/extensions/fff-native ci
npm --prefix .agents/skills/web-browser/scripts ci
```

Put `~/.pi/agent/bin` on `PATH`, then use `pi list` to inspect the configured packages. Pi manages the external npm packages listed in settings; the vendored subagent package has no third-party runtime dependencies. Authenticate providers and MCP separately on each machine. Run `/reload` in existing Pi sessions after setup; no subagent is started by the linker.

This syncs the managed configuration, not all of `~/.pi`: Pi/Rex binaries, credentials, sessions, trust decisions, caches, custom local models/scripts, and project-specific settings remain separate. Model and platform availability can differ. The optional fff-native helper needs a working native build toolchain for its install script.

## Verify the vendored fork

```bash
node --test scripts/pi-portability.test.mjs
node --test pi/agent/vendor/pi-subagent/*.test.ts
```

The fork is pinned at `c651997eb634353e13ffcb11ebcd73440dc93928` in `https://github.com/ayatofrench/pi-subagent`, with upstream attribution to `earendil-works/pi-subagent`. The original package README and source are preserved. Update the vendored files and lock together from a reviewed, published fork revision. Do not copy `node_modules`, repository metadata, or run-state files. Fork source edits belong in the fork first, then in a reviewed pin update here.
