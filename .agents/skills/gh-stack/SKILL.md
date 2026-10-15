---
name: gh-stack
description: Manage GitHub stacked PRs with `gh stack` across Git and Jujutsu. Use for creating, publishing, updating, inspecting, restructuring, or merging a dependent PR stack.
compatibility: Requires authenticated GitHub CLI, github/gh-stack, and repository access to the GitHub Stacked PRs preview.
metadata:
  author: ayato-french
  version: "1.1.0"
---

# gh stack

A stack is a linear dependency chain, always ordered **bottom to top**:

```text
main → auth (base main) → api (base auth) → ui (base api)
```

Git and jj have different local owners. Route first, then stay on that branch:

| VCS | Local owner | `gh stack` mode |
|---|---|---|
| Git | `gh stack` (`.git/gh-stack`) | managed stack commands |
| jj | jj changes and bookmarks | `link` plus numbered remote operations |

## 1. Preflight and route

```bash
gh auth status
gh stack --version >/dev/null 2>&1 || gh extension install github/gh-stack
gh stack --help

if jj root >/dev/null 2>&1; then echo jj
elif git rev-parse --show-toplevel >/dev/null 2>&1; then echo git
else echo none
fi
```

A colocated repository routes to jj because `jj root` wins. Exit code 9 means
Stacked PRs is unavailable for the repository; report that result and stop.

**Complete when:** authentication and the extension work, a repository is found,
and exactly one workflow below has been selected.

## 2. Plan the chain

Put foundations at the bottom and dependents above them. Give each layer one
cohesive review concern and a stable branch/bookmark name. Confirm the trunk,
remote, and exact bottom-to-top order before publishing.

Use explicit, non-interactive forms in agent sessions:

| Interactive form | Agent form |
|---|---|
| `gh stack init` | `gh stack init --base <trunk> <branches...>` |
| `gh stack add` | `gh stack add <branch>` |
| `gh stack checkout` | `gh stack checkout <stack-or-pr-or-branch>` |
| `gh stack submit` | `gh stack submit --auto [--open]` |
| `gh stack view` | `gh stack view --json` |

`modify`, `switch`, and argument-free `checkout` are TUI operations; restructure
with native VCS operations when an agent cannot operate the TUI.

**Complete when:** every layer has a distinct concern and its parent is known.

## 3A. Git-managed workflow

Inspect the working tree and topology, then configure deterministic conflict and
remote behavior:

```bash
git status --short
git log --oneline --decorate --graph -n 20
git remote -v
git config rerere.enabled true
git config remote.pushDefault origin  # when multiple remotes exist
```

Create and publish deliberately:

```bash
gh stack init --base main auth
git add <files> && git commit -m "Add auth layer"
gh stack add api
git add <files> && git commit -m "Add API layer"
gh stack add ui
git add <files> && git commit -m "Add UI layer"
gh stack submit --auto                # drafts; add --open when requested
gh stack view --json
```

Use native `git add` and `git commit` to control layer boundaries. For a lower
layer change, commit on that branch and propagate upward:

```bash
gh stack checkout api
git add <files> && git commit -m "Fix API contract"
gh stack rebase --upstack --remote origin
gh stack push --remote origin
gh stack view --json
```

Resolve rebase conflicts, stage the files, and run `gh stack rebase --continue`.
Use `gh stack rebase --abort` to restore the pre-rebase stack. After merges,
`gh stack sync --remote origin` reconciles the stack; `--prune` also deletes
merged local branches and therefore requires explicit approval.

**Complete when:** `view --json` shows the intended order, no layer needs rebase,
and every PR's base is the preceding branch (the bottom PR targets trunk).

## 3B. jj external-tool workflow

Keep the change graph in jj and give every PR layer a bookmark:

```bash
jj status
jj log -r 'trunk()..@' --no-pager
jj bookmark set auth -r <auth-rev>
jj bookmark set api -r <api-rev>
jj bookmark set ui -r <ui-rev>
jj git push --remote origin --bookmark auth --bookmark api --bookmark ui --dry-run
jj git push --remote origin --bookmark auth --bookmark api --bookmark ui
```

Publish only the remote relationship through `link`:

```bash
gh stack link --base main --remote origin auth api ui
```

`link` creates missing draft PRs, attempts to repair their bases, and stores no
local gh-stack metadata. Add `--open` when ready-for-review PRs were requested.
Use jj for editing, rebasing, navigation, and pushing; reserve `init`, `add`,
`checkout`, `modify`, `view`, `rebase`, `push`, `submit`, and `sync` for the Git
workflow.

A non-colocated workspace needs explicit GitHub context and trunk:

```bash
export GH_REPO=OWNER/REPO
gh stack link --base main auth api ui
```

After rewriting changes, verify/move bookmarks, push with jj, and rerun `link`
when membership or bases change. Append to known stack #7 with
`gh stack link 7 new-top`.

Verify every expected head/base pair; a base-update warning is incomplete work:

```bash
gh pr list --state all --json number,headRefName,baseRefName,url
```

**Complete when:** jj bookmarks point to the intended linear changes, all are on
the remote, and the PR JSON proves the complete head/base chain.

## 4. Remote operations

With either VCS, stack/PR numbers avoid local tracking:

```bash
gh stack merge <stack-number> --yes --squash
gh stack merge <pr-number> --yes --squash   # through this PR
gh stack unstack <stack-number>             # grouping only; keeps PRs/branches
```

Confirm the target and merge method before merge or unstack. In non-colocated jj,
keep `GH_REPO=OWNER/REPO` exported. A stack merge is atomic unless a merge queue
handles it, and repository rules cannot be bypassed.

**Complete when:** GitHub reports the requested remote state and all affected PR
URLs and outcomes have been reported to the user.
