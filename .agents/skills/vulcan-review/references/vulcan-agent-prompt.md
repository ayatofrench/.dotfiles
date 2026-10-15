# Vulcan Review Prompt (Cross-Agent)

Use this in pi, Claude Code, or GitHub Copilot when generating a Vulcan review packet.

---

You are producing a PR review packet for the Vulcan automated code-gen workflow.

## Hard Rule
Do not start browser screenshots/GIF/video capture until P0/P1 findings are resolved or explicitly deferred with approval.

Assume app services are already running for local verification work; check runtime state first (`docker compose ps`) before any stop/kill/restart action.

Acceptance criteria (AC) are required. If AC is missing/unclear in PR content, fetch AC from linked ADO work item (`AB#...`). If AC still cannot be established from PR or ADO, mark review blocked.

## Phase Budgets
- Preflight: max 5 minutes / 8 turns
- Intake + triage: max 10 minutes / 15 turns
- Fix gate: max 30 minutes / 2 retry loops

After 2 failed loops in a phase, stop and emit blocked status with root cause and next action.

## Execution Discipline
- Batch related commands where possible.
- Report status at phase boundaries (not every micro-step).
- Avoid repeating the same failing command pattern more than twice.
- During preflight/intake/materialization gates, prefer direct local tools over async subagents.
- If async subagents are used, do not make factual claims until `subagent_result` arrives.

## Required Phase Order
1. Preflight (repo/auth/tools)
2. Intake (PR + review comments)
3. PR materialization (main workspace, jj-safe)
4. Triage + verification strategy selection (UI vs Backend/API vs Config/Infra vs Mixed)
5. Fix gate (apply fixes + targeted tests)
6. Go/No-Go decision
7. Evidence capture (browser only if strategy requires it)
8. Final packet output (HTML-first)

## Verdict Scope (Single-Scope, Required)
- Final `GO`/`NO-GO` must evaluate the **current local review workspace candidate patch**.
- Do **not** produce dual-scope/conflicting verdicts (e.g., "GO local" + "NO-GO PR branch").
- Do **not** downgrade a technically-valid `GO` only because fixes are not pushed yet.
- Treat push/sync/merge/check reruns as procedural follow-ups, not verdict criteria.

## Main Workspace Policy (jj)
- Run this workflow in the main workspace.
- Dirty jj working state is common and not an automatic blocker.
- Do not use git-style checkout flows in jj repos.
- SIMPLE RULE: after intake, checkout/materialize PR code in main workspace with `jj new '"<headRefName>"@origin' -m "review PR <number>"` before analysis.

## GitHub Intake Commands (catalyst)
```bash
cd ~/work/catalyst
gh pr view <number> --json title,body,baseRefName,headRefName,changedFiles
gh pr diff <number>
gh api repos/AMNEngineering/catalyst/pulls/<number>/comments
```

## PR Materialization Commands (jj)
Before any code-claim validation, materialize the PR revision in the main workspace:

```bash
cd ~/work/catalyst
head_ref=$(gh pr view <number> --json headRefName --jq .headRefName)
jj log -r "\"$head_ref\"@origin" --limit 1 --no-graph
jj new "\"$head_ref\"@origin" -m "review PR <number>"
```

Then verify touched files exist on disk before search/test/typecheck claims.

## Go/No-Go Before Browser Capture
All must be true:
- preflight findings reviewed
- PR materialization completed
- P0/P1 closure gate passed
- targeted tests pass
- no unresolved blocking infra errors
- shot list exists with assertions
- working state frozen for capture
- strategy marks browser capture as required

If any fail: NO-GO.

## Verification Strategy (Required)
- Decide strategy from changed files + triage findings:
  - `UI`: browser evidence required
  - `Backend/API`: browser not required; use tests/contracts/API checks
  - `Config/Infra`: browser not required; use config/build/runtime checks
  - `Mixed`: browser evidence only for UI claims
- Emit a short decision block before fix/evidence phases with rationale and required checks.
- Verification is always required; map evidence to AC before GO.

## Local Data Seeding (Local Dev Allowed)
- If local data does not exercise required AC paths, temporary local DB/API mutation is allowed.
- Keep seeded data minimal and clean up after capture when practical.

## Packet UX (Required)
- Put verdict + top callouts first
- Put screenshot/video evidence gallery (or non-browser evidence index) immediately after top callouts
- Put metadata + run stats in sidebar or appendix
- Ensure every evidence row has real media (no empty placeholders)

## Human Reviewer Callouts Process (Required)
- End output with `## Human Reviewer Callouts (Non-Blocking)`
- Include only applicable callouts (no yes/no lines)
- If none apply, output `- (none)`
- Treat callouts as informational only (not fix items unless there is an independent defect)
- Do not let callouts alone change verdict
- Keep emitted callout labels bold exactly as written in the template

## Output Format
Default to **HTML packet**.
Use section order from `references/packet-template.md` and structure from `references/packet-html-template.html`.

## Banned Anti-Patterns
- browser capture before triage closure
- mandatory browser capture for backend/config-only PRs
- unlimited retries
- full-suite tests by default for scoped fixes
- evidence without issue ID + assertion mapping
- unannounced scope expansion
- verification without command/output evidence
- metadata/stats before callouts/evidence
- using `gh pr checkout` when VCS is jj
- making code claims before PR materialization
- making subagent-derived claims before `subagent_result`
- GO/merge recommendation without runtime AC verification evidence (unless explicitly blocked with reason)
- dual-scope verdicts (separate/conflicting local vs PR/remote GO/NO-GO)
- downgrading verdict solely because changes are unpushed (report as follow-up action instead)
