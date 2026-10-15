# Native Claude agents

`comment-sicko.md` is linked at `~/.claude/agents/comment-sicko.md`. The matching link is declared in `install.conf.yaml`. Existing agents were not replaced. Pi integration and `poteto-agent` are still pending.

The source voice is retained from pstack, Copyright (c) 2026 Lauren Tan, under the MIT License in LICENSE.txt. Native rules precede the source prose and resolve its conflicts with read-only review and local safety requirements.

## Requested configuration

- Model alias: `opus`.
- Effort: `medium`.
- Allowed tools: `Read`, `Grep`, `Glob` only.
- No nested agents, shell, MCP, editing tools, permission bypass, hooks, or automatic skill preload.

The alias is not a guarantee of Opus 5.5. Before dispatch, check effective model and effort against the host policy. Environment variables and invocation overrides can change the settings.

The parent supplies the repository, exact files or diff and base, task constraints, and resolved paths to all four guidance files. It must grant read access to those targets. A symlink path alone may not grant access to its target. The agent returns suggestions and evidence requests; the parent performs approved edits and runtime checks.

## Static verification

Claude CLI version: 2.1.289. `claude plugin validate --strict --json` returned success but an empty `contents` list, so it was not treated as evidence of recognition. Independent YAML parsing and local assertions checked the name, tool allowlist, model, effort, and safeguards.

## Authorized direct-definition fixture trial

Three sequential direct runs used `claude --print --agent comment-sicko`, not parent-to-subagent dispatch. The CLI explicitly requested `claude-opus-5-5`, medium effort, and only Read/Grep/Glob. Hooks, external MCP servers, and nested-agent tools were disabled. A synthetic file, not a work repository, was reviewed.

- First run stopped when guidance symlink targets were outside the allowed paths.
- Second run used resolved paths but initially attempted denied symlink reads.
- Third run received verified resolved guidance paths. It read all four, completed with no permission denials, and correctly classified four deletion candidates, two protected comments, and one unresolved vendor claim.
- CLI initialization reported model `claude-opus-5-5`, tools `Read`, `Grep`, `Glob`, and active per-turn effort control. Usage reported only `claude-opus-5-5`.
- The exact effective effort value was not exposed in the captured output. Medium was explicitly requested; effective medium is not independently proven.
- The fixture hash was unchanged after every run. Observed tool calls were read/search only. No nested agents were launched.
- Listed model costs totaled approximately $0.32 across the three runs.

Temporary evidence: `/tmp/pstack-comment-check.6fwn1q/` contains the fixture, streaming logs, and before/after hashes. This path is local and ephemeral. Do not treat its continued existence as a reproducibility guarantee.

## Remaining validation

- Verify parent-to-subagent dispatch of this installed type, including the definition's own model/effort/tool settings rather than only CLI-level restrictions.
- Check the actual effective medium effort and `opus` alias resolution.
- Confirm scope adherence on a larger fixture and detect missing repository instructions independently of VCS type. An absence of Git metadata does not prove an absence of instructions.
- Only then use an explicitly scoped work repository. Do not interpret this fixture trial as approval for autonomous cleanup.

The older files under `reference/pstack-local-agents/` are earlier drafts, not the canonical native Claude Comment Sicko definition.
