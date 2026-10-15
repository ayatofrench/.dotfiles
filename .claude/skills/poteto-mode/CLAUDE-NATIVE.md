# Native Claude Code execution

This reference maps pstack's workflows to Claude Code capabilities. A native equivalent is not a missing integration merely because the source used Cursor syntax. Check the actual tool declarations and installed version; do not invent arguments from another harness.

## Delegation

Use `Agent` and a registered `subagent_type`. Generic native type: `general-purpose`, not `generalPurpose`. Custom types come from reviewed files under `.claude/agents/` or `~/.claude/agents/`. The installed Comment Sicko type is `comment-sicko`; the other upstream agent drafts are not installed.

Keep the coordinator in the parent conversation. Each delegate receives a standalone brief: goal, user restrictions, repository, exact scope, revision, expected output, verification method, and resolved guidance paths. Subagents do not automatically inherit the full parent conversation or loaded skill bodies. Read source templates and pass their required context explicitly.

Native agent definitions support separate `model` and `effort` fields. Read MODELS.md to select the role. The installed 2.1.289 version predates documented per-invocation effort support (2.1.292). Use an appropriately configured agent definition when the call cannot set effort. A code delegate and a judgment delegate may need separate definitions even when they share the same source prompt. Do not assume that changing the Agent model argument also sets effort.

Do not send Cursor `readonly`, `environment`, or `cloud_base_branch` arguments. Restrict tools through native definitions. Removing Edit and Write does not establish read-only execution if Bash or mutating MCP tools remain. For simple static review, Read/Grep/Glob is a suitable allowlist. For history, runtime checks, or MCP investigation, choose a reviewed task-specific profile and do not bypass permissions.

Native tool availability may differ between foreground and background agents. Use supported background controls only. Never assume a successful background start means completion. Collect the actual result and verify its artifacts. Fresh-agent rules and parent ownership from pstack still apply.

Model, effort, or profile restrictions block a dispatch only when that required configuration cannot be applied. They are not evidence that Claude lacks subagents. Honor user bans on delegation. A same-family panel cannot be described as cross-family evidence.

## Questions and tasks

Use `AskUserQuestion` for genuine preference or authorization questions. Keep pstack's distinction between questions the system can answer empirically and decisions only the human can make.

For tracking, use the tools actually exposed in the session: TaskCreate/TaskGet/TaskList/TaskUpdate when available, or TodoWrite where provided. Preserve the chosen playbook's ordered steps and explicit skip reasons. These task-management tools are distinct from `Agent`. If neither mechanism is exposed, use a visible checklist, not a fabricated tool call.

## Native scheduling

Claude Code provides `/loop`, and scheduling tools such as CronCreate/CronList/CronDelete. Use these native facilities for polling or wakeups; do not build a replacement scheduler.

Choose fixed or dynamic scheduling according to the task. Include a measurable done predicate, maximum duration or attempt bound, and stop/cancel behavior. `/loop` needs an active session. Resume behavior depends on schedule type and version; a self-paced loop is not automatically restored. Background processes and monitor tasks are not durable workflows.

All imported pstack skills are explicit-only in this trial. A scheduled fire does not execute a slash command whose skill has `disable-model-invocation: true`. Instead, schedule an ordinary task prompt that explicitly tells Claude to read the resolved mode, contract, policy, and selected playbook files. Do not change skill invocation permissions merely to make scheduling work.

Use native Monitor only when it is exposed and a reviewed watcher is appropriate. Do not execute bundled watcher scripts before auditing them. Deployment, merge, and external-write authorization is independent of scheduling.

## Skill authoring

Claude natively discovers SKILL.md directories in project `.claude/skills/` and personal `~/.claude/skills/`. A native skill-authoring procedure is sufficient; do not assume an installed `/create-skill` command exists.

1. Read relevant existing skills and the local build-skill guidance if available.
2. Establish scope and intended invocation. Avoid collisions with personal, project, or bundled skills.
3. Write valid YAML frontmatter with a matching name and a specific description. Choose invocation controls deliberately.
4. Preserve useful prose, examples, and decision triggers. Bundle supporting references and scripts where needed.
5. Validate frontmatter, local paths, and tool instructions; run task-relevant tests without leaking eval criteria into trial prompts.
6. Verify actual discovery. Claude can pick up SKILL.md edits, but new discovery roots or agent definitions may require a reload or restart.

Do not treat `skills:` preloading as automatic for explicit-only pstack skills. The agent should read their resolved files when required.

## Sessions and continuity

Use native session continuation/resume or an explicit handoff. Identify the exact session and project before accessing transcripts. When available, the skill's CLAUDE_SESSION_ID substitution identifies a session, not permission to inspect other sessions.

Use the actual persisted transcript or captured stream output and inspect its schema before parsing. They are not the same format as Cursor agent transcripts. Runs with `--no-session-persistence` may have no saved transcript. Do not search all ~/.claude/projects or assume the current working directory reveals an unrelated agent's session.

A Claude skill is not Cursor's per-turn Custom Mode. Re-read required mode and policy content after task changes or context loss; preserve a durable handoff for long work.

## Repository and external tools

Jujutsu is required by these dotfiles. Use native Jujutsu history, diff, and workspace operations rather than executing Git command examples. For independent writers, prepare separate workspaces at explicit revisions. Claude's built-in Git-worktree isolation is not automatically a Jujutsu workspace adapter. Never reset or discard unrelated work to reproduce an upstream example.

For real-app verification, use the actual available browser, CLI, TUI, or application-driving tools. Claude provides native run/verify workflows in some versions, but availability and project recipes must be checked. The external `control-cli`, `control-ui`, and `deslop` skills are not native tool names. Select a suitable existing capability; do not claim one exists merely because the category has a native equivalent.

Benny, Grok Bot webhooks, and cloud-specific automation remain external integrations. Do not convert their service endpoints into Claude tool calls.

## Sources

- [Native agents](https://code.claude.com/docs/en/sub-agents)
- [Skills](https://code.claude.com/docs/en/skills)
- [Scheduling and loop limitations](https://code.claude.com/docs/en/scheduled-tasks)

Documentation can describe versions newer than the installed harness. Tool availability and observed behavior take precedence over guessed compatibility.
