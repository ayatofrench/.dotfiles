---
name: pstack-setup-pstack
description: Configures pstack model roles and thinking levels for local Pi. Use for setup, selecting Pi models, changing role choices, reviewing panels, or checking delegation readiness.
disable-model-invocation: true
license: MIT
---

# Setup pstack for Pi

Read [the pi execution contract](../poteto-mode/HARNESS.md) and [the current model policy](../poteto-mode/MODELS.md). This native workflow replaces the upstream setup procedure. Invoke it with `/skill:pstack-setup-pstack`.

Configure pstack only. Do not change the session model, global Pi settings, credentials, permissions, or unrelated agent definitions. Do not launch delegates, run paid model probes, or install staged agents without separate permission.

## 1. Load current state

Resolve the policy relative to this installed skill, following symlinks to its managed source. That file is the single role-policy source. Read it before proposing changes. If missing or malformed, stop and report the problem; do not invent defaults or overwrite it.

Read all 17 role entries, including panel lists and the cross-judge pool. Preserve custom assignments, panel order, repeated seats, unresolved entries, and evidence records. A rerun is an update, not a reset. Do not delete unknown or retired roles silently; show them and ask before removing them.

Pi assignments currently start unset by user choice. Do not borrow the Claude policy. Unset does not mean inherit-parent.

Keep the exact `provider/modelId` separate from the thinking level. Symbolic role labels and human display names are not runnable model IDs.

## 2. Discover capabilities without spawning agents

Inspect the installed Pi version, available model discovery facilities, and the actual agent tools or extension configuration. A read-only `pi --list-models` listing can identify catalog entries; it does not prove provider authentication, entitlement, thinking-level support, or subagent dispatch.

Check provider readiness only through a non-secret readiness facility when available. Do not print API keys, read auth files, or use a credential-printing command to enumerate models.

If capability information is unavailable, ask the user for exact provider/model IDs and supported thinking levels. Mark user-provided choices as user-confirmed, not runtime-tested. Never infer that because Pi supports a main-session model, the installed agent extension can dispatch it with the requested thinking level.

For each proposed assignment, distinguish:

- Exact provider/model identity and entitlement evidence.
- Thinking-level support for that model and provider.
- A registered agent tool or extension mechanism that can apply both fields.
- Whether the named agent definition is installed and available.
- Whether an authorized runtime check has confirmed the actual effective model and thinking level.

Record evidence source, date, and harness/extension version. Pi has no model-independent built-in equivalent of every Cursor Task option; inspect actual tool schemas rather than translating parameter names by guesswork.

## 3. Ask for a profile and role choices

Show the current unset or configured roles first. Ask the user to choose permitted models and thinking levels. Offer leaving roles unset; do not force a model choice for every role to complete setup.

Ask for a reasoning-budget preference only if useful. Build the proposal per model's supported thinking levels and the user's constraints; do not assume one budget maps to the same level across providers. Never edit effort suffixes into model IDs. If a requested level is unsupported, leave that assignment unresolved and ask rather than downgrading silently.

Support inheritance only when the user explicitly selects it, the agent mechanism supports it, and the effective inherited provider/model and thinking level can be checked against the role constraints. Do not copy Cursor aliases such as `auto` or `inherit-parent` into Pi configuration without a verified native meaning.

Show every role in a table with current assignment, proposed `provider/modelId` or unset state, thinking level, validation status, and dispatch mechanism. Do not invent code or judgment defaults.

For panels, use an ordered list of seats, each with a model and thinking level. List length determines fan-out; duplicate models still count as separate seats. Preserve the arena cross-judge pool as a pool from which one judge is selected, not a panel to launch in full. Explain seat-count and cost changes.

Record model family separately from provider. Different provider endpoints serving the same model family do not establish family diversity. If no suitable cross-family judge is available, report that requirement as blocked rather than claiming equivalence.

## 4. Confirm and validate

Ask the user to accept the complete proposal or change specific roles. Use an available native question tool or plain text. Do not write before confirmation. A clear prior instruction confirming the exact proposed choices counts; approval to build this setup skill does not.

Before saving, check all 17 role entries against the current policy inventory, including each panel seat, exact ID, thinking level, restriction, and dispatch capability. Do not silently remove unsupported seats or retired roles.

With explicit user approval, unresolved choices may be saved as requested, blocked assignments. Keep unset roles unset. Do not label catalog discovery or user-confirmed entitlement as successful native dispatch.

## 5. Save the confirmed host policy

Update only the resolved Pi `MODELS.md` file. Preserve unrelated content and user choices. Use a targeted edit, then re-read it and compare all roles and panel seats against the accepted proposal. A rerun with no changes should leave the file unchanged.

Include validation records and unresolved blockers. Saving the policy does not install agents or configure the installed extension automatically.

Before dispatch, the adapter must re-read this policy and apply the exact provider/model and thinking level through a supported agent mechanism. If it cannot apply both, the role stays blocked. Verified assignments do not override a user's no-subagent restriction.

## 6. Report what changed and when it applies

Report the policy path, changed roles, panel counts, validation evidence, and blocked capabilities. State explicitly that no agents were launched or installed unless separately authorized.

Re-read the policy on the next invocation. Use `/reload` after changing skill or prompt-template definitions; do not claim it validates models or installs agents. An agent extension may require its own reload or restart. A policy edit cannot reconfigure an agent that is already running.

## 7. Offer project verification once

Check whether the project has a real-app verification skill or harness. If absent, offer once to create one using [pstack-create-verification-skill](../pstack-create-verification-skill/SKILL.md). Do not start without acceptance. A build or type check alone does not prove runtime behavior.
