# In-process Subagents

This extension registers five blocking, Amp-style subagent tools:

- `oracle`
- `search`
- `librarian`
- `worker`
- `reviewer`

Each call creates a fresh persisted Pi session in the requested working directory. Child sessions receive only the explicit task, concise inline context, and a manifest of lazy file references supplied by the caller. Referenced file contents are never embedded in the initial prompt; the child reads only what it needs with bounded tools. Children do not inherit the parent transcript, extensions, skills, prompt templates, themes, or context files.

Agent identity, model, thinking level, and requested tools resolve from the nearest trusted `<workspace>/.pi/agents/*.md`, falling back to `~/.pi/agent/agents/*.md`. The extension intersects requested tools with a hardcoded role policy before creating the child.

Child settings merge `~/.pi/agent/settings.json` with trusted `<workspace>/.pi/settings.json`, including normal threshold-based compaction. Package and extension entries are not loaded because child extensions stay disabled to prevent recursion.

## Input contract

- `task` and inline `context` are limited to 64 KiB of UTF-8 text in total.
- `files` are lazy references shaped as `{ path, relativeTo? }`; no file content is loaded before the child starts.
- Relative references default to the child `cwd`. Use `relativeTo: "parent"` for paths rooted at the parent session working directory. Absolute paths ignore `relativeTo`.
- Preflight file status is advisory and included in the child prompt. Missing or unreadable references do not abort the run; the child must locate the correct file or report the missing input.
- A call accepts at most 50 file references.

## Execution contract

- Calls block until the child finishes.
- Independent sibling calls can run concurrently through Pi's normal parallel tool execution.
- The last assistant text and persisted child session ID/file are returned to the parent model.
- Errors, timeouts, cancellation, output-limit stops, and no-message outcomes still return the persisted session reference so an orchestrator can inspect or resume the child.
- Full child transcripts use Pi's native session format under `~/.pi/agent/sessions/subagents/`; they are not duplicated into the parent tool result.
- Child model usage is attached to the tool result.
- Calls inherit caller cancellation and have a 600-second timeout.
- Output is capped at Pi's standard 50 KB / 2,000-line tool limits.
- Child extensions are disabled, preventing recursive subagent invocation.

## Reviewer scope

`reviewer` reviews implemented code and concrete diffs only. Use `oracle` for plan, proposal, task-breakdown, and architecture/design critique. A plan may accompany an implementation as acceptance context, but is never itself a reviewer target, even when stored in a file or diff.

Supply readable patch artifacts and relevant source references (or explicitly scoped existing code for an audit). The reviewer has only `read`, `grep`, `find`, and `ls`: it cannot generate VCS diffs, fetch PR URLs, run tests, or edit files. Missing targets produce `NOT REVIEWED`, not an approval.

The global fallback uses `github-copilot/gpt-5.6-terra` with high reasoning; trusted workspace agent definitions can override it. Its instructions favor concrete, deduplicated findings with evidence, realistic impact, and calibrated severity over hunk narration or speculative advice. Verdicts are advisory, not merge/deploy actions.

The code-only boundary is conveyed through tool metadata and the agent prompt, not a deterministic runtime classifier. Reload the extension after changing tool metadata; existing child sessions retain their original instructions.

## Librarian networking

The Librarian receives the local `webfetch` implementation for bounded public-URL reads. It has no general web-search capability. Supply a repository or public URL explicitly when network access is needed.

## Rollback

Re-add `~/git/pi-interactive-subagents` to `~/.pi/agent/settings.json`, remove or disable `+extensions/subagent/index.ts`, then run `/reload`. Never load both implementations because their tool names collide.
