---
name: pstack-setup-pstack
description: Configures pstack model roles and effort for local Claude Code. Use for setup, changing model choices, reviewing panel sizes, or checking whether delegation is ready.
disable-model-invocation: true
license: MIT
---

# Setup pstack for Claude Code

Read [the claude execution contract](../poteto-mode/HARNESS.md) and [the current model policy](../poteto-mode/MODELS.md). This native workflow replaces the upstream setup procedure. Invoke it with `/pstack-setup-pstack`.

Configure pstack only. Do not change the session model, global Claude settings, credentials, permissions, or unrelated agents. Do not launch delegates, run paid model probes, or install staged agents without separate permission.

## 1. Load current state

Resolve the model policy relative to this installed skill, following symlinks to its managed source. That file is the single role-policy source. Read it before proposing changes. If missing or malformed, stop and report the problem; do not invent defaults or overwrite it.

Read all 17 role entries, including panel lists and the cross-judge pool. Preserve existing custom assignments, panel order, repeated seats, unresolved entries, and evidence records. A rerun is an update, not a reset. Do not delete unknown or retired roles silently; show them and ask before removing them.

Keep model and effort as separate fields. Record exact configured model IDs alongside display names once confirmed. Symbolic role names are not model IDs.

## 2. Discover capabilities without spawning agents

Inspect the actual available Agent tool contract, installed Claude version, supported native agent configuration, and applicable model restrictions. Use an entitled-model listing only if the installed harness actually provides one. Documentation and a model catalog describe capabilities, not account entitlement.

If the exact usable IDs or effort levels cannot be established, ask the user for the permitted IDs and constraints. Mark user-provided choices as user-confirmed, not runtime-tested. Do not guess versioned IDs from display names or treat the parent model as proof that another model is available.

For each proposed assignment, distinguish:

- Model identity and entitlement evidence.
- Effort support for that exact model.
- A native dispatch mechanism that can set both model and effort.
- Whether the named agent definition is installed and available.
- Whether an authorized runtime check has confirmed the actual effective model and effort.

Record evidence source, date, and harness version. Never print secrets or inspect credentials to enumerate models.

## 3. Propose choices within the user's restrictions

The existing policy records the requested Sonnet 5.5 code roles at xhigh and Opus 5.5 judgment and hardest-task roles at medium. Preserve those choices. Opus medium is the current allowed effort; do not raise it to high, xhigh, or max. If an assignment cannot be supported, show it as unresolved and ask rather than substituting another model or effort.

Ask whether the user wants to retain the current per-role effort profile or change specific allowed roles. Do not apply upstream's one-budget-for-every-model transformation. An overall budget preference is advisory and cannot override model-specific restrictions. Do not encode effort by editing a model ID suffix.

Support native `inherit` only when the user explicitly selects it and the effective inherited model and effort satisfy the role constraints. Do not copy Cursor's `auto` or `inherit-parent` aliases into native configuration. Unset never means inherit.

Show every role in a table with current choice, proposed exact ID or unresolved display name, effort, validation status, and dispatch method. No implicit fallback to source defaults or the parent model.

For panels, use an ordered list of seats, each with its own model and effort. List length is the fan-out count; duplicate models still count as separate seats. For the arena cross-judge pool, retain a pool from which one judge is selected, not a panel that launches every entry. Explain any change in cost or seat count.

Opus and Sonnet are both Claude-family models. Label cross-family judging as unavailable with this mapping. Do not claim a same-family panel satisfies the upstream cross-family requirement.

## 4. Confirm and validate

Ask the user to accept the complete proposal or change specific roles. Use a native question tool if available; otherwise ask in plain text. Do not write before confirmation. A clear prior instruction confirming the exact proposed mapping counts; approval to build this setup skill does not.

Before saving, check all 17 role entries against the current policy inventory. Check each seat, model ID, effort, role restriction, and dispatch capability. Do not silently remove unsupported seats or retired roles.

If a choice is still unresolved, save it only as a requested, blocked assignment with explicit user approval. Do not label the configuration operational. User-confirmed entitlement is not evidence of successful native dispatch.

## 5. Save the confirmed host policy

Update only the resolved Claude `MODELS.md` file. Preserve unrelated content and user choices. Use a targeted edit, then re-read the file and compare all role entries and panel seats against the accepted proposal. A rerun with no changes should leave the file unchanged.

Include validation records and unresolved blockers. Keep the requested mapping distinct from runtime verification. Saving a policy does not install agents or set their model and effort automatically.

The dispatcher must read this policy and apply the exact model and effort through supported native controls before each dispatch. If it cannot do that, the role stays blocked. A verified role still requires user permission to delegate in the current task.

## 6. Report what changed and when it applies

Report the policy path, changed roles, panel counts, restrictions, validation evidence, and blocked capabilities. State explicitly that no agents were launched or installed unless the user separately authorized that action.

On the next invocation, re-read the policy from disk. Content already loaded into a session may be stale; re-read the skill and policy or start a fresh session. Native agent definitions require their own reload/availability check if later changed. Do not claim that saving Markdown reconfigures a running agent.

## 7. Offer project verification once

Check whether this project has a real-app verification skill or harness. If absent, offer once to create one using [pstack-create-verification-skill](../pstack-create-verification-skill/SKILL.md). Do not start that work without acceptance. A build or type check alone does not prove runtime behavior.
