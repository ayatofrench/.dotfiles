---
name: pr-agent-ops
description: Scan PR comments for !agent[op] directives and execute operations. Currently supports !agent[add-note] to extract, classify, and save notes to the Obsidian work vault. Use when asked to scan a PR for agent comments, process agent directives, or add notes from a PR.
references:
  - references/note-categories.md
---

# PR Agent Ops — `!agent[op]` Comment Scanner

Scan a pull request for `!agent[op]` directives in comments and execute the corresponding operations.

## Directive Syntax

```
!agent[<operation>]
<body — everything after the directive line>
```

The directive MUST be the first non-whitespace content in a comment (or the first line of a block within a larger comment). The operation name is inside brackets. Everything following the directive line is the operation payload.

### Supported Operations

| Operation | Description |
|-----------|-------------|
| `add-note` | Extract, classify, and save a note to `~/vaults/work/` |

## Step 1: Fetch PR Comments

Fetch ALL comments from the PR — both issue-level and inline review comments:

```bash
# Issue comments (conversation tab)
gh api "repos/{owner}/{repo}/issues/<number>/comments" --paginate --jq '.[] | {id, body, user: .user.login, created_at: .created_at, html_url: .html_url}'

# Review comments (inline on code)
gh api "repos/{owner}/{repo}/pulls/<number>/comments" --paginate --jq '.[] | {id, body, user: .user.login, created_at: .created_at, html_url: .html_url, path: .path, line: .line, diff_hunk: .diff_hunk}'

# PR body itself (may also contain directives)
gh pr view <number> --json body,title,number,url,author,headRefName
```

## Step 2: Parse Directives

Scan every comment body for lines matching:

```
!agent[<op>]
```

**Parsing rules:**
- Case-insensitive operation name: `!agent[Add-Note]` and `!agent[add-note]` are equivalent
- A single comment may contain multiple directives — split on each `!agent[` occurrence
- The payload for each directive is everything from the line after `!agent[op]` until the next `!agent[` or end of comment
- Trim leading/trailing whitespace from the payload
- **Skip already-processed directives** — if the comment body contains `<!-- agent-processed -->`, skip the entire comment. This marker is added in Step 4 after successful processing.

Collect all parsed directives with their metadata:
- `operation`: normalized lowercase op name
- `payload`: the body text
- `author`: GitHub username of the commenter
- `created_at`: timestamp
- `html_url`: link back to the comment
- `comment_id`: the GitHub comment ID (needed for Step 4 edit-back)
- `comment_type`: `"issue"` or `"review"` (determines which API to PATCH)
- `original_body`: the full unmodified comment body (needed for Step 4 edit-back)
- `context`: for review comments, include `path` and `line` (the code location)

## Step 3: Execute Operations

### `add-note` Operation

Read `./references/note-categories.md` for the full category taxonomy and classification rules.

For each `add-note` directive:

#### 3a. Classify the Note

Analyze the payload and determine:

1. **Category** — one of the categories defined in `references/note-categories.md`
2. **Title** — a concise, descriptive title (used as filename)
3. **Tags** — 2-5 Obsidian tags from the taxonomy, always including the source PR

#### 3b. Write the Note

Write an Obsidian-compatible markdown file to the vault:

**Path**: `~/vaults/work/<category>/<title>.md`

**Format:**

```markdown
---
title: "<Title>"
date: <YYYY-MM-DD>
tags:
  - <category>
  - <tag1>
  - <tag2>
  - pr/<repo>/<number>
source: "<html_url>"
author: "<github_username>"
pr: "<pr_url>"
---

# <Title>

<Classified and cleaned-up note content>

---

> [!info] Source
> From PR [#<number>](<pr_url>) — [comment](<comment_html_url>)
> Author: @<author> · <date>
```

**Writing rules:**
- Create the category subdirectory if it doesn't exist
- Filename: Kebab-case title, max 60 chars, no special chars → `my-note-title.md`
- If a file with the same name exists, append `-2`, `-3`, etc.
- Preserve code blocks, links, and formatting from the original comment
- Light cleanup only: fix obvious typos, normalize whitespace — do NOT rewrite the author's words
- If the directive came from an inline review comment, include the code context:

```markdown
## Code Context

File: `<path>` (line <line>)

```<lang>
<diff_hunk — last ~10 lines for context>
`` `
```

## Step 4: Mark Comments as Processed

After **each** directive is successfully written to the vault, edit the original GitHub comment to mark it processed. This prevents re-processing on subsequent scans.

**Marker format:** Append `<!-- agent-processed -->` (hidden HTML comment) to the body, and add a visible footer so the human can see it was handled.

**New comment body:**

```markdown
<original body>

---
> ✅ **Processed by agent** — <YYYY-MM-DD>
> Saved to `<category>/<filename>.md`
<!-- agent-processed -->
```

**API calls:**

```bash
# For review comments (inline on code):
gh api "repos/{owner}/{repo}/pulls/comments/<comment_id>" \
  -X PATCH -f body="<new_body>"

# For issue comments (conversation tab):
gh api "repos/{owner}/{repo}/issues/comments/<comment_id>" \
  -X PATCH -f body="<new_body>"
```

**Rules:**
- Only mark after the note file is **confirmed written** to disk
- If the API edit fails, log a warning but do NOT fail the whole run — the note is already saved
- The `<!-- agent-processed -->` marker MUST be the last line so Step 2 detection is simple

## Step 5: Summary Report

After processing all directives, present a summary:

```markdown
## Agent Ops Summary — PR #<number>

| # | Operation | Title | Category | Path | Marked |
|---|-----------|-------|----------|------|--------|
| 1 | add-note  | ...   | ...      | ~/vaults/work/... | ✅ |

**Processed:** <N> directives from <M> comments
**Skipped:** <K> (list reasons — unknown ops, empty payloads, already processed, etc.)
```

## Error Handling

- **Already processed**: Comment contains `<!-- agent-processed -->` — skip silently, count in summary
- **Unknown operation**: Log a warning, skip, include in summary as "skipped"
- **Empty payload**: Skip with warning — `add-note` requires content
- **No directives found**: Report "No !agent directives found in PR #<number>"
- **API failures (fetch)**: Retry once, then report the error
- **API failures (mark processed)**: Log warning, continue — the note is already saved to disk

## Examples

### Simple note from a PR conversation comment

```markdown
!agent[add-note]
We decided to use event sourcing for the audit trail instead of CDC.
The main reasons: better replay capability, natural fit with our
existing Celery task model, and Amanda already publishes domain events.
```

→ Saved as `~/vaults/work/decisions/event-sourcing-for-audit-trail.md` with tags `decisions`, `architecture`, `event-sourcing`

### Note from an inline code review comment

```markdown
!agent[add-note]
This retry pattern with exponential backoff is the standard we should
follow for all external API calls. Max 3 retries, base delay 1s.
```

→ Saved as `~/vaults/work/patterns/exponential-backoff-retry-standard.md` with code context block
