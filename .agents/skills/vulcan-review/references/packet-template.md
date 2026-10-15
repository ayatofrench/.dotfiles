# PR Review Packet Template (HTML-First)

> Rule: **Callouts + evidence first.** Metadata and stats are secondary and should be in a sidebar or appendix.

## 1) Executive Callouts (Top of Page)
- **Verdict:** `correct` | `needs attention`
- **Go/No-Go:** `GO` | `NO-GO`
- **Verdict scope:** local review workspace candidate patch (**single-scope**)
- **Top blockers/callouts:** (P0/P1 only; max 3 bullets)
- **Immediate action requested:** (if any)

Verdict semantics:
- Decide `GO`/`NO-GO` only from the current local candidate patch quality vs AC/story + evidence.
- Do **not** split verdicts by local vs PR/remote state.
- Treat push/sync/merge/check reruns as procedural follow-ups (not verdict criteria).

## 2) Verification Strategy Decision (Top of Page)
- **Selected strategy:** `UI` | `Backend/API` | `Config/Infra` | `Mixed`
- **Browser evidence required:** `yes` | `no`
- **Why this strategy applies:**
- **Required checks/evidence:**

## 3) Evidence Index (Top of Page)

If browser is required:

| Shot ID | Issue ID | Assertion | Result | Media |
|---|---|---|---|---|
| S-1 |  |  | ✅/❌ | `<img ...>` |
| S-2 |  |  | ✅/❌ | `<img ...>` |

If browser is not required:

| Check ID | Issue ID | Assertion | Result | Artifact |
|---|---|---|---|---|
| V-1 |  |  | ✅/❌ | test output / command log |
| V-2 |  |  | ✅/❌ | API contract / config validation |

**Required:**
- No empty `<figure>` placeholders
- Every media item has caption + assertion mapping
- If video exists, include both link + short summary frame still

## 4) Findings Summary (Local Candidate State)
| Issue ID | Priority | Status | One-line impact | Owner |
|---|---|---|---|---|

## 5) Detailed Findings
### [P1] Title
- **File:** `path/to/file:line`
- **Why it matters:**
- **What changed / should change:**
- **Status (local candidate):** Open | Fixed | Deferred

## 6) Fix Summary (Applied in Local Candidate)
| Issue ID | Change Summary | Files | Commit/Ref |
|---|---|---|---|

## 7) Verification Log
| Check | Command | Result | Key Output |
|---|---|---|---|

## 8) Go/No-Go Gate Before Browser Capture
- [ ] Preflight passed
- [ ] P0/P1 resolved or approved deferred
- [ ] Targeted tests pass
- [ ] No unresolved blocking infra errors
- [ ] Shot list defined with assertions
- [ ] Working state frozen for capture
- [ ] Verification strategy says browser is required

Decision: `GO` | `NO-GO`

If strategy says browser is not required, mark this section `N/A (strategy)`.

## 9) Triage Table
| Issue ID | Priority | Source | Decision | Owner | Status | Notes |
|---|---|---|---|---|---|---|

## 10) Residual Risks / Follow-Ups
- (none)

## 11) Metadata + Run Stats (Sidebar or Appendix)
- Repo:
- PR:
- Base branch/bookmark:
- Head branch/bookmark:
- Commit SHA(s):
- Timestamp (UTC):
- Agent/tool used (pi / Claude Code / Copilot):
- Review duration:
- Retry loops used:
- Total tests run:

## 12) Constraints & Preferences
- (none)

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

If none apply:
- (none)

Rules for this section:
1. These are informational callouts for the human reviewer, not fix items.
2. Do not include them in Findings unless there is an independent defect.
3. These callouts alone must not change the verdict.
4. Only include callouts that apply to the reviewed change.
5. Keep each emitted callout bold exactly as written.
6. Keep verdict single-scope (local candidate patch); do not branch verdict by remote/push state.
