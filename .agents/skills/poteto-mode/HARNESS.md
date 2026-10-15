# Pi execution contract

This is a local trial of the full pstack mode, workflows, and supporting skills. Read this contract before applying the imported instructions. It replaces Cursor-specific execution details, but not the engineering guidance or verification requirements.

## Authority and activation

- User restrictions, project instructions, permissions, and tool availability take precedence over these skills. A no-subagent instruction applies even when an upstream workflow says delegation is mandatory.
- Invoke `/poteto-mode` through the personal prompt template or `/skill:poteto-mode` directly. Neither creates Cursor Custom Mode persistence. Re-read the relevant guidance when starting a new task or recovering context.
- Each imported supporting skill is explicitly invocable. Pi commands use `/skill:pstack-<name>`, not Cursor slash commands. Read a referenced skill by its actual local path when routing internally.
- Supporting skills are named `pstack-how`, `pstack-why`, `pstack-architect`, and so on. Upstream bold skill names still identify those imported versions. `poteto-help`, `poteto-mode`, and `principle-*` retain their names. Do not silently substitute unrelated local skills such as `tdd` or `bro`.
- Read the inline principle index in `SKILL.md`, then the selected leaf principles in full. The full 23-playbook catalog is in that skill; load the chosen file from `playbooks/`.

## Models and delegation

Read [MODELS.md](MODELS.md). Pi model assignments are undecided. `PSTACK_CODE_ROLE` and `PSTACK_JUDGMENT_ROLE` in the imported prose are symbolic roles, not model IDs.

Do not launch model-dependent delegates, panels, or agent swarms until the user configures and authorizes them. Never fall back to upstream models, guess a model ID, or treat an unset role as inherit-parent.

For work that can be done in the main session, state that delegation is unavailable, keep the same investigation and verification steps, and execute directly. Mark the delegation step as skipped with a reason. If independent review or model diversity is necessary to the requested result, report that requirement as blocked. Self-review does not satisfy it.

The staged agent definitions under `reference/pstack-local-agents/pi/` are not installed. Their execution requires a separately verified adapter for the installed Pi agent extension. Do not assume Cursor's `Task`, `subagent_type`, background flags, or resume semantics map to the available Pi tools.

## Native workflow execution

- Use actual registered tools. Do not issue Cursor `Task`, `AskQuestion`, or todo calls. Use the available todo tool, if present, for the verbatim playbook steps and explicit skip reasons; otherwise keep a Markdown checklist in the task artifact.
- No Cursor `/loop` equivalent is installed by this port. Use bounded checks with explicit success, timeout, and stop conditions. Do not create an unbounded background loop.
- Use Jujutsu for repository operations. Preserve small verifiable units, but do not execute embedded Git commands or force a rewrite of unrelated work. PR creation, remote writes, and merges require the user's requested scope and authorization.
- `control-cli`, `control-ui`, and `deslop` are unbundled dependencies. Use a verified local control or review tool only if it provides the required capability. Otherwise report the relevant verification step as blocked. Compilation alone is not runtime proof.
- Use the local `build-skill` guidance in place of Cursor's built-in `create-skill` when editing skills. Do not weaken the source prose merely to meet an arbitrary length target.
- Read only the session transcripts explicitly associated with this task. Cursor cloud URLs and `.cursor/projects` lookup instructions do not apply. Pi session JSONL access must use the local session-reading guidance and task-scoped paths.

## Imported assets and integrations

Bundled scripts and package files are preserved for review, not approved to run. Inspect each script for Git, Cursor, network writes, destructive actions, credentials, runtime dependencies, and host assumptions before executing it. Do not install script dependencies automatically.

Use [pstack-setup-pstack](../pstack-setup-pstack/SKILL.md) for the native Pi setup workflow. It reads the current policy, checks capabilities, preserves role and panel choices, and saves only a confirmed proposal. Do not write `.cursor/rules` or invent model IDs. Pi roles stay unset until the user chooses them. Saving the policy alone does not configure agent dispatch.

`pstack-make-bot-ui` and Benny are reference-only integrations. This import does not enable bot webhooks, Slack operations, cloud agents, Tailscale, or autonomous merges.

`poteto-help`'s Cursor installation and Custom Mode instructions describe upstream behavior, not this local setup. Use this contract when answering local setup questions. The complete upstream guide is retained under `reference/pstack/docs/guide/` in the dotfiles repository.
