# Pi Subagent for Rex

A Rex-based fork of [earendil-works/pi-subagent](https://github.com/earendil-works/pi-subagent).

Observable, persistent Pi subagents for independent reviews, investigations, and delegated implementation.

Each subagent runs in its own Rex session with a dedicated Pi JSONL session. The parent can inspect status, wait for durable results, steer active work, queue follow-ups, or attach directly to the child TUI.

## Requirements

- Pi
- Node.js 22.19 or newer
- Rex on `PATH` (tested with `0.0.1791811459-ga601bc`)

## Install

Clone the fork, register the local package, and expose the CLI on `PATH`:

```sh
mkdir -p ~/git
jj git clone https://github.com/ayatofrench/pi-subagent ~/git/pi-subagent
pi install ~/git/pi-subagent
mkdir -p ~/.pi/agent/bin
ln -s ~/git/pi-subagent/subagent.ts ~/.pi/agent/bin/subagent
```

Ensure `~/.pi/agent/bin` is on `PATH`. Disable other subagent extensions before enabling this package. The local checkout remains the source for updates.

Run `/reload` in an existing Pi session. The extension contributes its bundled skill automatically.

## Usage

Spawn with a descriptive name using the parent session's provider, model, and thinking level:

```sh
subagent spawn --name review --prompt "Review the current diff independently"
```

Names appear in the parent UI. Generated handles remain the stable identifiers used by management commands.

Override the model configuration when needed:

```sh
subagent spawn \
  --provider openai-codex \
  --model gpt-5.4-mini \
  --thinking low \
  --prompt "Find the relevant implementation"
```

Provide multiple prompt fragments and files:

```sh
subagent spawn \
  --file /tmp/spec.md \
  --prompt "Implement this specification" \
  --prompt "Run the targeted tests"
```

Restrict tools for a read-only investigation:

```sh
subagent spawn --tools read,grep,find,ls --prompt "Investigate the failure"
```

Manage a run by its generated handle:

```sh
subagent status a1b2c3
subagent rename a1b2c3 "error handling review"
subagent send a1b2c3 "Focus on error handling"
subagent send a1b2c3 --follow-up "Then summarize"
subagent wait a1b2c3
subagent stop a1b2c3
subagent list
```

Use `/subagent` to select and attach to an active child. The status widget shows active names (or handles for unnamed runs) and their current state.

## Rex behavior

- Children start as detached sessions labeled `pi-subagent-<handle>`. Metadata records the stable Rex session ID.
- Commands and prompts are passed as literal arguments with `--shell none`. The child receives the spawning process's `PATH` and Pi agent directory, not only the Rex server's environment.
- Inside Rex, `/subagent` uses the app's `session.select` action. `REX_CLIENT` selects a client; without it, Rex requires exactly one connected app. Return to the parent with Rex's session picker. If selection fails, Pi reports the error instead of opening a nested terminal.
- Outside Rex, `/subagent` temporarily stops Pi's TUI and runs `rex attach`. Detach with Rex's configured detach key to return to Pi.
- Rex keeps empty sessions after commands exit. Status checks inspect the child block; stop and parent shutdown also remove the empty session.
- Control commands use the current `REX_SERVER` or Rex's default server. Keep the same server when managing or resuming runs. Server errors are reported, not treated as missing children.
- Existing upstream run records are not supported. Finish and stop old runs with their original implementation before switching.

## Tests

```sh
npm ci --ignore-scripts
npm run check
npm test
RUN_REX_TESTS=1 npm test
```

The opt-in suite uses temporary Rex sessions and the upstream `pi-test.sh` launcher seam. It tests literal arguments, environment, process exit, CLI spawn/status/send/wait/stop, and transcript reuse on relaunch without model calls. Test sessions are removed afterward. It does not test live model output, the interactive picker, app selection, or terminal attachment.

## Isolation

Optional spawn flags:

- `--tools <names>`: comma-separated tool allowlist
- `--no-extensions`: disable extension discovery while retaining the control bridge
- `--no-skills`: disable skills
- `--no-prompt-templates`: disable prompt templates
- `--no-context-files`: ignore repository instruction files

Nested subagents are disabled. Child sessions do not receive the subagent skill. Children survive `/reload`. When their spawning Pi session quits or is replaced, running children are suspended: the process stops, but transcript and metadata are kept. Resuming that parent session relaunches them idle with their full history. `subagent stop` removes a run permanently.
