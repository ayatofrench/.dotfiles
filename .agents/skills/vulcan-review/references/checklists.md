# Checklists

## Preflight Checklist

- [ ] VCS detected (`git` or `jj`)
- [ ] Working state assessed (jj dirty state is allowed in main-workspace flow)
- [ ] `gh auth status` passes
- [ ] `node` available
- [ ] `ffmpeg` available
- [ ] test runner available
- [ ] browser automation prerequisites available

Preflight findings are informational for this workflow.
Dirty jj working state alone is not a blocker.
Record blockers, then continue to PR materialization in the main workspace.

---

## Intake + Triage Checklist

- [ ] Acceptance criteria (AC) established from PR description/body
- [ ] If PR AC is missing/unclear: pull AC from linked ADO work item (`AB#...`)
- [ ] If AC still unavailable: mark review blocked (missing AC contract)
- [ ] PR metadata loaded (title, base/head, changed files)
- [ ] Diff loaded
- [ ] Copilot/human review comments loaded
- [ ] GitHub intake run from `~/work/catalyst`:
  - `gh pr view <number> --json title,body,baseRefName,headRefName,changedFiles`
  - `gh pr diff <number>`
  - `gh api repos/AMNEngineering/catalyst/pulls/<number>/comments`
- [ ] Findings classified P0/P1/P2/P3
- [ ] Triage decisions captured (fix now / defer)
- [ ] Owner + rationale captured for deferred items

---

## PR Materialization Checklist (Main Workspace)

- [ ] PR `headRefName` resolved from `gh pr view <number> --json headRefName`
- [ ] PR revision resolved in jj (`jj log -r '"<headRefName>"@origin'`)
- [ ] Main workspace moved to review commit with `jj new '"<headRefName>"@origin' -m "review PR <number>"`
- [ ] PR-touched files verified on disk before search/test/typecheck claims
- [ ] `gh pr checkout` not used in jj repositories

---

## Fix Gate Checklist

- [ ] P0/P1 items fixed or explicitly deferred with approval
- [ ] Targeted tests for touched scope pass
- [ ] No unresolved blocking infra/tool errors
- [ ] Working state frozen before capture

---

## Verification Strategy Checklist

- [ ] Strategy selected from PR scope (`UI` | `Backend/API` | `Config/Infra` | `Mixed`)
- [ ] Decision rationale recorded
- [ ] Required verification checks listed explicitly
- [ ] Browser requirement recorded (`required` | `not required`)
- [ ] Scope-to-evidence mapping defined (which claim is proven by which check/media)
- [ ] AC-to-evidence mapping defined (each AC has explicit proof or blocked rationale)

---

## Go/No-Go Before Browser Capture

All must be true:

- [ ] Preflight findings reviewed
- [ ] PR materialization completed
- [ ] P0/P1 closure gate passed
- [ ] Targeted tests passed
- [ ] Shot list exists
- [ ] Each shot has expected assertion
- [ ] Working state frozen for evidence
- [ ] Verification strategy says browser evidence is required
- [ ] Runtime state checked first (`docker compose ps` / equivalent) before disruptive actions

If any false: **NO-GO** (do not capture screenshots/GIF/video).

---

## Packet Assembly Checklist (HTML-First)

- [ ] Final packet rendered as **HTML**
- [ ] Top section includes verdict + P0/P1 callouts (above fold)
- [ ] Verdict scope is explicit: local review workspace candidate patch (single-scope)
- [ ] No dual-scope verdict language (e.g., GO local / NO-GO PR branch)
- [ ] Verification strategy decision is shown near top (before detailed findings)
- [ ] If browser required: screenshot/video evidence gallery appears before detailed findings
- [ ] If browser not required: non-browser evidence index (tests/contracts/config checks) appears before detailed findings
- [ ] Every shot has a real media element (`<img>`/video), not placeholder-only markup
- [ ] Metadata and run stats are in sidebar or appendix (not first section)
- [ ] Packet ends with `## Human Reviewer Callouts (Non-Blocking)` section
- [ ] Human callouts include only applicable items (no yes/no lines)
- [ ] If none apply, section contains `- (none)`
- [ ] Packet opened locally for visual verification before sharing

---

## Retry + Escalation Rule

After 2 failed loops in any phase:

Output this block and stop retries:

```md
## Blocked
- Phase:
- Symptom:
- Root cause:
- Next action:
```
