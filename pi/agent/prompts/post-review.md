---
description: Post a finished code review to a GitHub PR in my specific format
argument-hint: "<PR#> [approve|comment|request-changes] [--inline|--body-only]"
---

Post the already-completed review of PR **$1** to GitHub in my exact format. The review work is already done (`pr-code-review` skill, a `pr-review-final.md` artifact, or the conversation above) — this only governs **posting**. Do not re-run the review.

`$2` may hint the verdict: `approve` | `comment` | `request-changes`. `$3` may set mode: `--inline` (inline comments + overview) or `--body-only` (overview only). Choose automatically if absent.

**Tone: direct, no fluff, no emojis, no thanks, no compliments, no sign-offs.** Get to findings immediately.

## Resolve repo + HEAD

```bash
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo AMNEngineering/catalyst)
PR=$1
HEAD=$(gh pr view "$PR" --repo "$REPO" --json headRefOid -q .headRefOid)
gh pr diff "$PR" --repo "$REPO" > /tmp/pr$PR.diff
```

`HEAD` is mandatory for inline comments or formal request-changes.

## Pick event + mode

| Verdict | `event` | Mode |
|---|---|---|
| Clean LGTM | `APPROVE` | **B** — short `gh pr review --approve --body` |
| Findings pinned to lines | `REQUEST_CHANGES` | **A** — JSON `--input` + inline comments |
| Advisory feedback, don't gate the queue under my identity | `COMMENT` | **A** — JSON `--input` + inline comments |
| Long prose verdict, no line pins | `REQUEST_CHANGES` | **C** — `--body-file` |

Default: Mode A for any findings, Mode B for clean approve, Mode C only when verdict is prose with no inline pins. Prefer `COMMENT` when I don't want my review to formally block the merge queue but state the verdict + blocker **explicitly** in the body; use `REQUEST_CHANGES` for hard release-blockers.

## Mode A — inline comments

Write `/tmp/pr$PR-review/review.json`:

```json
{
  "commit_id": "<HEAD>",
  "event": "REQUEST_CHANGES" | "COMMENT",
  "body": "<overview — see format>",
  "comments": [
    { "path": "<repo-relative path as in the diff b/ side>", "line": <new-file line>, "side": "RIGHT", "body": "<inline — see format>" }
  ]
}
```

Anchoring: `side` always `"RIGHT"` (new side); map `@@ -a,b +c,d @@` hunks to real new-file lines; only anchor on lines the diff actually touches or accepts. One comment per finding, on the most-specific line that introduces it. For a new file, anchor on the first relevant diff line (class/def or first body line), never line 1 unless it's the docstring.

```bash
python3 -c "import json; json.load(open('/tmp/pr$PR-review/review.json')); print('JSON valid')" \
  && gh api -X POST "repos/$REPO/pulls/$PR/reviews" --input /tmp/pr$PR-review/review.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('Posted:', d.get('id'), d.get('state'), d.get('html_url'))"
```

## Mode B — approve

```bash
gh pr review "$PR" --repo "$REPO" --approve --body "<approve body>"
gh pr view "$PR" --repo "$REPO" --json reviewDecision,mergeStateStatus -q '{reviewDecision,mergeStateStatus}'
```

Always include `--body`. Never bare `--approve`.

## Mode C — long body, no inline

```bash
mkdir -p /tmp/pr$PR-review && cat > /tmp/pr$PR-review/review-body.md <<'EOF'
<overview body>
EOF
gh pr review "$PR" --repo "$REPO" --request-changes --body-file /tmp/pr$PR-review/review-body.md
```

## Overview body format

Open with one H2:
- `## Automated multi-reviewer code review` (from `pr-code-review`)
- `## Automated Code Review — <AB#workitem> (<short feature>)` (tied to an ADO work item)
- `## Code Review — PR #<N> (<short title>)` (focused single review)

Then:

1. **One provenance line, then the verdict.** No risk paragraph, no praise. E.g. `Reviewed by 4 parallel reviewers (bugs / security / perf / tests) + Thermos + oracle. Verdict: REQUEST CHANGES.` Then `### Verdict: REQUEST CHANGES` (or `APPROVE`, or `### Verdict: REQUEST CHANGES (blocked on <the one thing>)`).
2. Severity sections, only those with content, fixed order, **plain headers — no emoji**:
   - `### Critical (release blocker)` / `### Critical (P0)` — must-fix; cite runtime evidence and concrete fix.
   - `### Warnings (non-blocking)` / `### Warnings (P1)` — should-fix; structural/dead-code/perf.
   - `### Suggestions` — optional polish.
   - `### Validated correct` / `### Dismissed (no action)` — what checked fine; dismissals with one-line "why".
3. `### Human reviewer callouts (non-blocking)` — bulleted, **exactly these bold lead-ins**, only the ones that apply, none invented:
   - `**New dependency:**` · `**Dependency/lockfile change:**` · `**Auth/permission behavior:**` · `**Config defaults:**` · `**Backwards-incompatible public schema/API/contract:**` · `**Irreversible/destructive operation:**` · `**Feature flags added/removed:**` · `**DB migration:**` · `**Deploy ordering:**` / `**Prod rollout:**`

Severity bullets: **bold mini-title** → finding → **verified evidence** when checked against the branch (e.g. `` `uv lock --check` fails in greenlight-api/ ``) → `Fix:` line for Critical/Warning. **No closing stamp, no sign-off.** Body ends on the last callout.

## Inline comment format

**No emojis.** Open with a **plain bold label** matching the severity, then the note. Self-contained (author reads it on the diff line). Cadence:

- `**Critical / release blocker.** <what's wrong>. Verified: <evidence>. Fix: <action>.`
- `**Dead code.** <what's unused and why>. <contrast with a wired sibling if one exists>.`
- `**Structural debt (non-blocking).** <what grew, precedent, what to extract>.`
- `**Silent no-op risk.** <heuristic and how it fails open without a log>. Consider <fix>.`
- `**Dead in production.** <only referenced by tests; route through or delete + test the predicates>.`

Reference `path:line` of siblings only when it sharpens the note.

## Approve body format

One or two direct sentences; credit the review in shorthand, state the verdict, name non-blocking notes. No praise, no `🤖`, no sign-off.

- `No blocking issues; only minor non-blocking cleanup suggestions (multi-reviewer + Thermos + oracle).`
- `No blocking defects; only optional Low-severity maintainability polish (<specifics>).`
- `Re-reviewed head <short sha>. <issue> is addressed by <how>. Approving.`
- `All prior review findings addressed (see re-review). CI green, <checks> pass.`
- `QA verified live: <what was exercised>. Rebased onto <branch>.`

## Re-review (author replied to a prior review)

Preserve all prior reviews and comments as immutable history. Re-fetch `HEAD` (it may have advanced) and post a new review with the new `commit_id`.

A re-review approve references the new head sha and names exactly what was addressed.

## Hard rules

- Validate JSON before POST; never fabricate a line number (drop unanchored findings into the overview).
- Anchor only on diff lines; `side` always `"RIGHT"`.
- Confirm the posted result (report `id`/`state`/`html_url` for Mode A, `reviewDecision` for Mode B) and state which `event` you used and why.
- Never `APPROVE` content you didn't verify; if blocked use `REQUEST_CHANGES`/`COMMENT`.
- Prefer `--body-file`/`--input` over escaping a giant `--body`.
- Repo defaults to `AMNEngineering/catalyst` but always run the `gh repo view` detection.
- No emojis, no fluff, no thanks, no compliments, no sign-offs — throughout.