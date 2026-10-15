# Claude Code execution contract

This is a local trial of the full pstack mode, workflows, and supporting skills. Read this contract and [the native Claude execution reference](CLAUDE-NATIVE.md) before applying workflow instructions. The Claude import translates supported harness operations to native equivalents; this contract preserves permission, model-policy, and verification requirements.

## Authority and activation

- User restrictions, project instructions, permissions, and tool availability take precedence over these skills. A no-subagent instruction applies even when an upstream workflow says delegation is mandatory.
- Invoke `/poteto-mode` explicitly. This is an inline Claude skill, not a forked agent or Cursor Custom Mode. Do not promise persistent re-injection across turns or compaction.
- Supporting skills are named `/pstack-how`, `/pstack-why`, `/pstack-architect`, and so on. Upstream bold skill names identify those imported versions. `poteto-help`, `poteto-mode`, and `principle-*` retain their names. Do not silently substitute unrelated local skills such as `tdd` or `bro`.
- All imported supporting skills are explicit-only in this trial. When a workflow references one, read its `SKILL.md` at its sibling path. Do not rely on automatic discovery or assume an explicit-only skill can be preloaded into an agent by name.
- Read the inline principle index in `SKILL.md`, then selected leaf principles in full. The full 23-playbook catalog is in that skill; load the chosen file from `playbooks/`.

## Models and delegation

Read [MODELS.md](MODELS.md). `PSTACK_CODE_ROLE` and `PSTACK_JUDGMENT_ROLE` are symbolic roles, never model IDs. The user requested Sonnet 5.5 at xhigh for code roles and Opus 5.5 at medium for judgment and hardest-task roles.

These assignments are pending runtime validation of entitled model IDs and effort settings. Do not launch delegates with guessed IDs, fallback model families, or effort encoded into a Cursor model slug. Confirm the installed harness accepts the requested model and effort independently before using them. Never silently downgrade or inherit a different configuration.

Claude Code uses its native Agent tool and supported agent definitions, not Cursor's `Task` parameter schema. Inspect the available tool contract before dispatch. Do not assume every native agent invocation supports all Cursor options or per-call effort selection.

The native Comment Sicko definition is maintained at `pstack/hosts/claude/agents/comment-sicko.md` and linked at `~/.claude/agents/comment-sicko.md`. A direct-definition fixture run discovered it and used explicitly requested Opus 5.5 with only read/search tools. Parent-to-subagent dispatch and effective effort reporting remain unverified. Resolve required guidance symlinks and grant read access to their actual targets before dispatch. Earlier agent drafts under `reference/pstack-local-agents/claude/` remain uninstalled; do not treat those drafts as available agent types.

If delegation is unavailable or forbidden, keep the investigation and verification steps and execute eligible work directly. Record the skipped delegation step. Independent review or model-diversity requirements remain blocked; self-review is not independent verification. Opus and Sonnet are in the same provider family, so a panel of these models does not satisfy an upstream cross-family condition.

## Native workflow execution

- Use available Claude tools for reading, editing, questions, and task tracking. Preserve verbatim playbook steps and explicit skip reasons using the native task tools when available, otherwise a Markdown checklist.
- Use Claude's native `/loop` and exposed scheduling or Monitor tools for polling and wakeups. Follow CLAUDE-NATIVE.md for version-specific limitations, explicit-only skill scheduling, cancellation, and measurable stop conditions. Do not build a replacement scheduler.
- Use Jujutsu for repository operations. Preserve small verifiable delivery units, but do not execute embedded Git commands or force a rewrite of unrelated work. PR creation, remote writes, and merges require the user's requested scope and authorization.
- `control-cli`, `control-ui`, and `deslop` are unbundled dependencies. Use a verified local control or review tool only if it provides the required capability. Otherwise report the verification step as blocked. Compilation alone is not runtime proof.
- Use the native skill-authoring procedure in CLAUDE-NATIVE.md, with local `build-skill` guidance when available. Write Claude SKILL.md files directly rather than assuming a `/create-skill` command. Do not weaken the source prose merely to meet an arbitrary length target.
- Read only transcripts explicitly associated with the current task. Cursor cloud URLs and `.cursor/projects` paths do not apply. Confirm actual Claude session paths and available transcript tooling before reading them. Do not search unrelated personal chats.

## Imported assets and integrations

Bundled scripts and package files are preserved for review, not approved to run. Inspect each script for Git, Cursor, network writes, destructive actions, credentials, runtime dependencies, and host assumptions before executing it. Do not install script dependencies automatically.

Use [pstack-setup-pstack](../pstack-setup-pstack/SKILL.md) for the native Claude setup workflow. It reads the current policy, checks capabilities, preserves role and panel choices, and saves only a confirmed proposal. Do not write `.cursor/rules` or derive effort-suffixed model slugs. Saving the policy alone does not configure agent dispatch.

`pstack-make-bot-ui` and Benny are reference-only integrations. This import does not enable bot webhooks, Slack operations, cloud agents, Tailscale, or autonomous merges.

`poteto-help` now describes the local Claude entry points and native scheduling. Public guide links still point to the preserved upstream documentation, whose Cursor-specific details do not configure this local setup. Use this contract and CLAUDE-NATIVE.md for local execution. The complete upstream guide is retained under `reference/pstack/docs/guide/` in the dotfiles repository.
