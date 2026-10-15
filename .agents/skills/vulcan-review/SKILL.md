---
name: vulcan-review
description: Run review-first PR packet workflows for Vulcan automated code generation changes. Use when asked to review a Vulcan PR, triage GitHub/Copilot comments, apply fixes before browser evidence, and produce a standardized review packet.
references:
  - references/checklists.md
  - references/packet-template.md
  - references/packet-html-template.html
  - references/vulcan-agent-prompt.md
---

# Vulcan Review (Review-First)

Use this skill for PR reviews tied to the Vulcan code-gen flow.

## Core Rule

**Do not start browser evidence capture until P0/P1 triage items are resolved or explicitly deferred with approval.**

Assume the local app stack is already running. Check runtime state first (`docker compose ps`) before any stop/kill/restart action.

Acceptance criteria (AC) are required. If AC is missing/unclear in the PR, fetch from linked ADO (`AB#...`). If AC still cannot be established, mark review blocked.

Use an adversarial review posture: try to disprove AC with evidence; do not assume implementation correctness from code/tests alone.

## Verdict Scope (Single-Scope, Required)

The final verdict is **single-scope** and must evaluate the **current local review workspace candidate patch**.

- `GO` means the local candidate patch satisfies AC/story evidence and has no unresolved P0/P1 blockers.
- `NO-GO` means unresolved blockers remain in that local candidate patch.
- Do **not** split verdicts by location/state (e.g., "GO local" + "NO-GO on PR branch").
- Do **not** downgrade a technically-valid `GO` only because changes are not pushed yet.
- Treat push/sync/merge/check reruns as procedural follow-ups, not verdict criteria.

## Required Phase Order

1. **Preflight** (repo/auth/tooling readiness)
2. **Intake** (PR diff + GitHub/Copilot comments)
3. **PR Materialization** (main workspace, jj-safe)
4. **Triage + Verification Strategy Selection** (decide UI/browser vs non-browser verification)
5. **Fix Gate** (apply fixes + targeted tests)
6. **Go/No-Go Check**
7. **Evidence Capture** (browser only when strategy requires it)
8. **Packet Assembly (HTML-first)**

Do not skip or reorder phases.

## Budgets + Retry Caps

- Preflight: **5 min / 8 turns max**
- Intake + Triage: **10 min / 15 turns max**
- Fix Gate: **30 min / 2 retry loops max**

If retry cap is hit, stop and output:
- blocked status,
- root cause,
- next action.

## Execution Discipline (Cost + Speed)

- Batch related commands in one step where practical.
- Report progress at **phase boundaries**, not every micro-action.
- Prefer deterministic selectors/commands over exploratory click loops.
- If a command pattern fails twice (e.g., VCS revset syntax), switch strategy and log one concise note.
- During preflight/intake/materialization gates, prefer direct local tools (`jj`, `gh`, `grep`, `read`) over async subagents.
- If async subagents are used, do **not** make factual claims until a `subagent_result` is received.

## Preflight Execution

Run:

```bash
~/.agents/skills/vulcan-review/scripts/preflight.sh
```

If unavailable, use equivalent checks from `references/checklists.md`.

Preflight is informational for this workflow. Do not hard-stop on preflight warnings; continue to PR materialization in the main workspace.

### Main Workspace Policy (jj)

- This workflow runs in the **main workspace**.
- A dirty jj working copy is common and **not an automatic blocker**.
- Treat dirty jj state as operational context; do not run git-style branch checkout flows.
- SIMPLE RULE: after intake, materialize the PR in main workspace with `jj new '"<headRefName>"@origin' -m "review PR <number>"` before analysis.

## GitHub Intake (Vulcan)

Collect PR context with `gh` before triage (for `~/work/catalyst`):

```bash
cd ~/work/catalyst
gh pr view <number> --json title,body,baseRefName,headRefName,changedFiles
gh pr diff <number>
gh api repos/AMNEngineering/catalyst/pulls/<number>/comments
```

Use this data to build the triage table before any screenshot/GIF work.

## PR Materialization (Required)

Before any code-claim validation (`search`, `grep`, tests, typecheck, conclusions), materialize the PR revision in the main jj workspace.

For `~/work/catalyst`:

```bash
cd ~/work/catalyst
head_ref=$(gh pr view <number> --json headRefName --jq .headRefName)
jj log -r "\"$head_ref\"@origin" --limit 1 --no-graph
jj new "\"$head_ref\"@origin" -m "review PR <number>"
```

Then verify PR files are present on disk before analysis/test claims.

## Catalyst jj Notes (Common Pitfalls)

- Bookmark refs containing `#` must be quoted in revsets, e.g.:
  - `jj log -r '"vulcan/AB#499525"@origin' --limit 1 --no-graph`
- For main-workspace PR review in jj, materialize PR code with `jj new`, e.g.:
  - `jj new '"vulcan/AB#499525"@origin' -m "review PR <number>"`
- Do **not** use `gh pr checkout` in jj repos.
- If you hit immutable commit errors, use `jj new <rev>` (not `jj edit <rev>`).
- For squash flows that may open an editor, use non-interactive mode when needed:
  - `JJ_EDITOR=true jj squash --into <rev>`
- If merge/PR tooling reports detached-branch confusion, verify PR state directly:
  - `gh pr view <number> --json state,mergedAt,mergeCommit`

## Adaptive Verification Strategy (Required)

Choose verification strategy from actual PR scope before running fix/evidence phases.

Verification is required on every review. Do not issue GO without AC-mapped evidence (or an explicit blocked rationale).

### Strategy Selection Inputs
- Changed files from `gh pr view ... changedFiles` and `gh pr diff --name-only`
- Findings triage (P0/P1/P2/P3)
- Risk type (UI behavior, API/contract behavior, config/runtime behavior)

### Strategy Types

1. **UI/Frontend strategy**
   - Trigger: UI surfaces changed (e.g. `greenlight/src/**`, `packages/ui/src/**`, `amanda/widget/**`)
   - Required evidence: targeted tests + browser screenshots/video assertions
   - Prefer at least one in-app (non-harness) verification when feasible

2. **Backend/API strategy**
   - Trigger: service/model/rules changes without user-facing UI impact
   - Required evidence: unit/integration/API contract checks (no mandatory browser capture)

3. **Config/Infra strategy**
   - Trigger: CI/workflow/config/dependency/runtime-only changes
   - Required evidence: config validation/build/startup/lint checks (no mandatory browser capture)

4. **Mixed strategy**
   - Trigger: both UI and non-UI changes
   - Required evidence: split verification by scope; browser evidence only for impacted UI claims

### Local Data Seeding for Verification (Allowed)

If local runtime data does not exercise required AC paths, local DB/API mutation is allowed to create verifiable states.

- Local dev/testing environments only
- Use temporary, minimal seeded records
- Clean up seeded data after evidence capture when practical

### Required Decision Block

Before Fix Gate, output:
- selected strategy,
- why it applies,
- exact required checks/evidence,
- whether browser capture is required (`yes`/`no`).

## Packet UX Rules (Required)

1. **Most important content first**
   - Put verdict, blocking callouts, and decision summary at the top.
2. **Evidence above fold**
   - Put screenshot/video (or non-browser evidence) immediately after top callouts.
3. **Metadata + stats de-emphasized**
   - Place metadata/run stats in a sidebar or appendix section.
4. **No empty media placeholders**
   - Every evidence item must include a real `<img>`/media element and caption.

## Human Reviewer Callouts Process (Match `review.ts`)

The section must be emitted **at the very end** of the packet with this exact heading:

`## Human Reviewer Callouts (Non-Blocking)`

Rules:
- Include only applicable callouts (no yes/no lines).
- Treat callouts as informational only; not fix items by themselves.
- Do not include callouts in Findings unless there is an independent defect.
- Callouts alone must not change the verdict.
- Keep emitted callout labels bold and exactly as defined in `references/packet-template.md`.
- If none apply, write `- (none)`.

## Deliverable Format (Default HTML)

- Default output is **HTML** packet.
- Use layout guidance in:
  - `references/packet-template.md`
  - `references/packet-html-template.html`
- For pi, write packet to artifact and/or `/tmp`, then open it for user review.
- Optional: also emit markdown snapshot for text portability.

## Output Contract

Use section order from:
- `references/packet-template.md`

For non-pi agents, use:
- `references/vulcan-agent-prompt.md`

## Explicitly Banned

- Browser capture before P0/P1 closure gate
- Unlimited retries in a single phase
- Full-suite tests by default for small scoped fixes
- Evidence without issue ID + assertion mapping
- Scope expansion without explicit note
- Verification claims without command/output evidence
- Metadata/stats placed before verdict/callouts/evidence
- Mandatory browser capture for backend/config-only PRs
- Converting non-blocking human callouts into fix tasks without an independent finding
- Using `gh pr checkout` when VCS is jj
- Making codebase claims before PR materialization in Phase 3
- Making subagent-derived claims before `subagent_result` arrives
- GO/merge recommendation without runtime AC verification evidence (unless explicitly blocked with reason)
- Dual-scope verdicts (e.g., separate/conflicting local vs PR-branch GO/NO-GO)
- Downgrading verdict solely because fixes are unpushed (report as follow-up action instead)
