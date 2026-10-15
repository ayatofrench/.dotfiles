---
name: pr-code-review
description: Review a PR in PHASES — fast summary first, then primary reviewers (max 3 in flight at a time), then Thermos, then oracle validation. Use when asked to review a PR, audit a pull request, or check PR quality.
references:
  - references/reviewer-prompts.md
  - ../coding-standards/topics/TESTING_AND_VERIFICATION.md
  - ../tdd/SKILL.md
---

# PR Code Review with Summary + Oracle Validation

Review a pull request in CLEAR PHASES: a fast summary FIRST, then the four primary reviewers (two bursts, max 3 in flight), then the two Thermos reviewers (launched together), correlate results into a severity-ranked summary, and finally validate with the oracle. **NEVER SKIP ORACLE REVIEW.**

**Subagent execution model:** `reviewer()` and `oracle()` are blocking tool calls whose results contain the specialists' final text. Independent calls emitted together run concurrently.

**Execution discipline (hard limits — overriding):**
1. **Never launch more than 3 subagents in a single response.** Fanning out 6+ overwhelms provider rate limits, and prior phases inform later ones anyway.
2. **Phase boundaries are gates.** Wait for every blocking tool result in a phase before launching the next phase. Do not overlap phases.
3. **Step-by-step is the point.** Ordered, bounded concurrency — not a fanout.

## User Guidance

The user provides a PR number or link as the argument to this skill.

## Step 1: Fetch PR Diff and Metadata

Fetch the PR details using `gh` CLI:

```bash
gh pr diff <number>          # full diff
gh pr view <number>          # title, description, author, base branch, changed files
```

Store both outputs for use in subsequent steps.

## Step 2: Detect VCS and Create Review Workspace

Detect whether the project uses `jj` or `git` (check for `.jj/` directory).

Set a review workspace root before creating any workspace:

```bash
# Catalyst must use an external workspace root so repo-local file indexers/watchers
# do not scan nested full checkouts.
if [ "$(basename "$PWD")" = "catalyst" ]; then
  WORKSPACE_ROOT="${CATALYST_WORKSPACE_ROOT:-$HOME/work/catalyst-workspaces}"
else
  WORKSPACE_ROOT="${PR_REVIEW_WORKSPACE_ROOT:-$PWD/.worktrees}"
fi
mkdir -p "$WORKSPACE_ROOT"
```

### For jj repos

1. Determine the repo name from the current directory
2. Get the PR's head branch: `gh pr view <number> --json headRefName -q .headRefName`
3. Create a workspace: `jj workspace add "$WORKSPACE_ROOT/pr-review-<number>"`
4. Check out the PR branch: `cd "$WORKSPACE_ROOT/pr-review-<number>" && jj new <branch-name>`
5. All subsequent file reads use the workspace path

**Cleanup (after the PR is approved — NOT before):**

Do NOT clean up the review workspace when the review is merely *posted*. The author may reply, request changes, or push a new head, and you will need the workspace again for re-review. Keep it until the PR is **approved** (your approval posted, or the author's requested-changes resolved and you re-approve). Only then:
```bash
jj workspace forget pr-review-<number>
rm -rf "$WORKSPACE_ROOT/pr-review-<number>"
```

### For git repos

1. Create a worktree: `git worktree add "$WORKSPACE_ROOT/pr-review-<number>" <branch-name>`
2. All subsequent file reads use the worktree path

**Cleanup (after the PR is approved — NOT before):**

Do NOT clean up the review worktree when the review is merely *posted*. The author may reply, request changes, or push a new head, and you will need the worktree again for re-review. Keep it until the PR is **approved** (your approval posted, or the author's requested-changes resolved and you re-approve). Only then:
```bash
git worktree remove "$WORKSPACE_ROOT/pr-review-<number>"
```

## Step 3: Haiku Summary (runs FIRST, presented immediately)

Launch a **single** reviewer to produce a quick PR summary. This runs BEFORE the full review so the human gets context immediately.

```
reviewer(
  task: "Summarize this PR using the supplied diff and metadata",
  context: "<concise user guidance only>",
  files: [{ path: "<absolute diff path>" }, { path: "<absolute metadata path>" }],
  cwd: "$WORKSPACE_ROOT/pr-review-<number>"
)
```

The summarizer receives lazy file references to:
1. The full PR diff
2. PR metadata (title, description, author, base branch)

Do not paste either artifact into inline `context`.

It must return:

```markdown
# PR Summary
- **Purpose**: One-paragraph summary of what the PR does and why
- **Key files for human review**: Ranked list of files the reviewer should focus on, with a brief reason
- **Risk assessment**: Low / Medium / High with rationale
```

**Present this returned summary to the user immediately** — this gives the human reviewer context to start reading code.

**This is Phase 1: wait for the summary result before starting Phase 2.**

## Step 4 / Phase 2: Launch the FOUR Primary Code Reviewers (two bursts, max 3 in flight)

**Gate:** only after the **Phase 1 summary result is available**. Each reviewer gets the same diff but a different lens. Do NOT pass the summary to reviewers — they review independently. Do NOT launch the Thermos reviewers in this step — they are Phase 3 and must wait until Phase 2 finishes.

Load detailed reviewer prompts from `./references/reviewer-prompts.md`.

There are now **four** reviewers. To stay within the 3-in-flight limit, launch them in **two bursts**, each a gate:

**Burst A (3 in flight)** — launch in one response, wait for all three blocking results before Burst B:
```
reviewer(task: "<bug-hunter prompt>",     context: "<concise guidance>", files: [{ path: "<absolute diff path>" }], cwd: "<workspace>")
reviewer(task: "<security prompt>",       context: "<concise guidance>", files: [{ path: "<absolute diff path>" }], cwd: "<workspace>")
reviewer(task: "<performance prompt>",    context: "<concise guidance>", files: [{ path: "<absolute diff path>" }], cwd: "<workspace>")
```

**Burst B (1 in flight)** — gate on Burst A done:
```
reviewer(task: "<tests prompt>", context: "<concise guidance>", files: [{ path: "<absolute diff path>" }], cwd: "<workspace>")
```
Wait for its result before starting Phase 3.

**Reviewer 1 — Bug Hunter**: Logic errors, edge cases, race conditions, null safety, off-by-one errors, broken error handling.

**Reviewer 2 — Security & Structure**: OWASP Top 10, auth bypass, data exposure, adherence to existing patterns and conventions, proper use of established abstractions.

**Reviewer 3 — Performance & Correctness**: Algorithmic complexity, N+1 queries, blocking I/O on hot paths, incorrect API usage, behavioral regressions.

**Reviewer 4 — Tests & Verification** (aligned with `../coding-standards/topics/TESTING_AND_VERIFICATION.md` and the `../tdd` skill): tests prove behavior through real seams, no module mocks / method spies, risk-matched evidence for every material changed behavior / failure path / boundary / persistence / async / runtime assumption, tests-that-cannot-fail, fake-proves-wrong-thing, missing evidence for new code.

Each reviewer input MUST include:
1. A lazy file reference to the full diff; never paste it inline
2. The user's guidance (if any)
3. Instruction to **read full files for context** — diffs alone are insufficient (Reviewer 4 must open the test files AND the production files to confirm the seam)
4. The specific review lens described above

Each reviewer returns its findings directly. The parent retains those results for correlation.

### Required Human Reviewer Callouts

Each reviewer MUST append this final section after findings/verdict:

```markdown
## Human Reviewer Callouts (Non-Blocking)

Include only applicable callouts (no yes/no lines):

- **This change adds a database migration:** <files/details>
- **This change introduces a new dependency:** <package(s)/details>
- **This change changes a dependency (or the lockfile):** <files/package(s)/details>
- **This change modifies auth/permission behavior:** <what changed and where>
- **This change introduces backwards-incompatible public schema/API/contract changes:** <what changed and where>
- **This change includes irreversible or destructive operations:** <operation and scope>
- **This change adds or removes feature flags:** <feature flags changed> (call out re-use of dormant feature flags!)
- **This change changes configuration defaults:** <config var changed>
- **This change adds or changes tests / test approach:** <what tests were added/changed and the seam used; call out any module mocks or method spies introduced, or new behavior with no behavior test>
```

Rules for this section:
1. These are informational callouts for the human reviewer, not fix items.
2. Do not include them in Findings unless there is an independent defect.
3. These callouts alone must not change the verdict.
4. Only include callouts that apply to the reviewed change.
5. Keep each emitted callout bold exactly as written.
6. If none apply, write `- (none)`.

## Phase 3: Launch the Thermos Reviewers (burst of 2)

**Gate:** only after **all four Phase 2 reviewer results are available**. Now launch the Thermos workflow (`thermos` skill): launch both review lenses together against the same diff/workspace. Wait for both blocking results before correlation.

Run them as Phase 3 (separate from Phase 2) so total in-flight subagents never exceeds 3, and so each phase can build on the previous one's output.

## Step 5 / Phase 4: Correlate Results

After **both Phase 3 Thermos results are available**, merge and deduplicate all findings:

1. **Deduplicate**: Same file + same line range + same issue = one finding
2. **Rank by severity**:
   - **Critical** — Must fix: bugs, security vulnerabilities, data loss risks
   - **Warning** — Should fix: structural issues, missing guards, performance problems
   - **Suggestion** — Consider: style improvements, minor optimizations, readability
3. **Note consensus**: Flag findings reported by 2+ reviewers (higher confidence). Testing findings from `reviewer-tests` often corroborate bug/perf findings (e.g. an uncovered failure path) — join them.
4. **Merge callouts**: Deduplicate reviewer `Human Reviewer Callouts (Non-Blocking)` entries. Keep them separate from findings and do not let them affect severity or verdict.

Present the correlated summary:

```markdown
## Code Review Summary

### Critical ({count})
- [{file}:{line}] {issue} (reported by {N}/4 reviewers)
  - {explanation and suggested fix}

### Warnings ({count})
- [{file}:{line}] {issue}
  - {explanation}

### Suggestions ({count})
- [{file}:{line}] {issue}

### Human Reviewer Callouts (Non-Blocking)
{deduplicated applicable callouts, or `- (none)`}
```

## Step 6 / Phase 5: Oracle Validation (MANDATORY)

**Gate:** only after Phase 4 correlation is done.

Invoke the oracle subagent for deep review of the correlated findings.

```
oracle(
  task: "Validate the correlated findings against the referenced PR diff and workspace",
  context: "<correlated findings and concise guidance>",
  files: [{ path: "<absolute diff path>" }],
  cwd: "<workspace>"
)
```

The oracle input MUST include:
1. A lazy file reference to the original diff; never paste the diff inline
2. The correlated findings from Step 5
3. The deduplicated `Human Reviewer Callouts (Non-Blocking)` from Step 5
4. Instructions to evaluate each finding by examining surrounding code, system architecture, and abstractions

The oracle should:
- **Confirm** findings that are accurate bugs/issues
- **Dismiss** findings that are false positives (explain why)
- **Escalate** any issues the reviewers missed
- **Recommend** specific fixes for confirmed findings
- **Validate testing findings** by opening the test AND the production file: confirm whether the test proves the behavior through the caller-facing seam, and dismiss testing findings that misread the seam or the toolchain mechanism
- **Preserve/adjust** human reviewer callouts as non-blocking informational items, separate from findings

The oracle prompt MUST also remind the oracle to load the language-specific `../coding-standards/langs/<lang>/CONTRACTS.md` + `IDIOMS.md` and `../coding-standards/topics/TESTING_AND_VERIFICATION.md` before judging testing seam/toolchain claims, so dismissals are grounded in the project's testing standards rather than generic taste.

The oracle returns its validation directly.

## Step 7 / Phase 6: Final Report + Cleanup

When the Oracle result returns, compile the final report from the retained summary, reviewer results, and Oracle validation.

Present the oracle-validated report with the summary at the top:

```markdown
## PR Code Review — Final Report

### Summary
{Summary from Step 3: purpose, key files, risk assessment}

### Confirmed Issues
{oracle-confirmed findings, ranked by severity}

### Dismissed (False Positives)
{findings the oracle dismissed, with reasoning}

### Additional Issues Found by Oracle
{any new issues the oracle identified}

### Recommended Actions
{prioritized list of what to fix and how}

### Human Reviewer Callouts (Non-Blocking)
{oracle-validated informational callouts, or `- (none)`}
```

Save the final report with the parent session's normal file-writing tools when the workflow requires a durable artifact.

**Do NOT clean up the review workspace yet.** Keep it until the PR is **approved** (your approval posted, or the author's requested-changes resolved and you re-approve). The author may reply, request changes, or push a new head, and you will need the workspace for re-review. See the Step 2 cleanup commands and run them only once the PR is approved.

## Execution Flow (phased — max 3 subagents in flight at once; every phase is a gate)

```
Step 1: Fetch diff + metadata          (bash, blocking)
Step 2: Create workspace               (bash, blocking)

PHASE 1 — summary (1 blocking reviewer call):
  - reviewer summary                  → present returned result immediately

PHASE 2 — primary reviewers (two bursts, max 3 in flight; gate on Phase 1 done):
  Burst A (3): reviewer-bugs, reviewer-security, reviewer-perf  → wait for all 3 results
  Burst B (1): reviewer-tests                                   → wait for its result

PHASE 3 — thermos (2 in flight; gate on Phase 2 done):
  - reviewer: thermo-nuclear lens
  - reviewer: thermo-quality lens        → wait for both results

Phase 4: Correlate findings            (main session)
PHASE 5 — oracle (1 in flight):
  - oracle                            → wait for its result
Phase 6: Final report + cleanup        (main session)
```

## Common Mistakes

- **Named subagent calls are blocking.** Consume their returned tool results directly.
- **Diff-only reviews.** Always instruct reviewers to read full files for context.
- **Skipping the oracle.** It catches false positives and finds issues reviewers miss.
- **Overlapping phases / fanout overwhelm.** Phase boundaries are gates: do not start Burst B until Burst A's three results return, or Phase 3 until all four Phase 2 results return. Never launch more than 3 subagents in one response.
- **Premature cleanup.** Do NOT delete the review workspace/worktree when the review is merely posted. Keep it until the PR is **approved** (your approval posted, or the author's requested-changes resolved and you re-approve) — the author may reply, request changes, or push a new head, and you need the workspace for re-review.
