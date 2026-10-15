---
name: pstack-no-comments
description: Audits comment slop with pstack's Comment Sicko rules and performs scoped cleanup when requested. Use for redundant comments, commented-out code, workaround explanations, and noisy suppression comments.
disable-model-invocation: true
license: MIT
---

# No comments for Pi

Read [the pi execution contract](../poteto-mode/HARNESS.md), then [Comment Sicko's review rules](references/comment-sicko.md). Invoke with `/skill:pstack-no-comments` and a repository, files, or diff scope.

This native workflow works in the main session without configured subagents. Do not spawn agents unless separately permitted and the host's model and dispatch configuration is ready. Do not call a main-session pass an independent review.

## 1. Establish scope and mode

Respect the target repository's instructions before reading or editing its code. Use caller-specified files, directories, or diff. A repository-wide audit is valid only when explicitly requested. Without a scope, use the current change against its identified base, including working-copy changes. If the base or repository is unclear, ask; do not assume a branch called `main` exists.

Use Jujutsu for repository operations. Do not run embedded Git commands. Preserve unrelated and pre-existing edits.

Default to a read-only audit. When the user explicitly requests cleanup, perform comment-only edits within the agreed scope. Broader code fixes, suppression removal, and behavioral changes require separate approval. Do not create commits, PRs, or remote writes unless requested.

## 2. Audit comments in context

Apply Comment Sicko's deletion-first taste, but read surrounding code before judging a comment. Inspect comment syntax for the actual language. Use search to locate candidates, not as proof that text is a comment. Do not delete strings, SQL hints, build tags, source directives, generated-file markers, documentation examples, or protocol data with a bulk regex.

Classify findings as:

- **DELETE:** redundant narration, stale explanations, commented-out corpses, decorative banners, or comments made unnecessary by clear code.
- **KEEP:** legal/license headers, public API contracts, required tool directives, or proven external constraints that code cannot express.
- **RESHAPE:** comments revealing a non-obvious internal workaround or unclear code. Identify the symbol and root cause; do not rewrite application code during a comment-only pass.
- **VERIFY:** ambiguous claims or constraints that need evidence before removal.

For lint and type suppressions, identify the exact rule and reason. Never delete a directive or weaken checks merely to remove comment slop. Keep unresolved suppressions and flag the code fix needed. Read relevant local code and, when needed, [pstack-how](../pstack-how/SKILL.md) or [pstack-why](../pstack-why/SKILL.md). Their delegation steps remain subject to the host contract.

Report file and line, category, reason, and the smallest safe action. In a large scope, cover it in explicit batches and report what remains unreviewed. Do not present a sample as a complete audit.

## 3. Review findings before cleanup

Check every proposed deletion against scope, surrounding code, public contracts, directives, and the keep exceptions. Reject unsupported claims and application-code edits. Ambiguity is not proof of safety: keep VERIFY items pending evidence and report them open. This overrides upstream's instruction to delete ambiguous comments.

When delegated review is available, inspect the actual findings rather than forwarding them. Rerun once for a rejected report with the specific failure named. If the second report is invalid, stop accepting that report and disclose the unresolved review.

## 4. Clean only the approved category of work

In cleanup mode, remove accepted DELETE items with targeted edits. Do not alter behavior, widen scope, remove legal headers, or remove public API documentation that is still needed. Leave KEEP and unresolved VERIFY items intact.

Offer the smallest type, test, runtime check, or lint that could replace a constraint comment. Wait for approval before implementing such an encoding or removing the comment that preserves the unresolved constraint. For RESHAPE findings, offer a separate root-cause fix; if approved, use [pstack-architect](../pstack-architect/SKILL.md) where needed, then implement and verify it as a separate code change.

## 5. Verify and report

Inspect the actual diff. Count comments separately from changed lines; state the counting method. Check that comment syntax, directives, and surrounding formatting remain valid. Run appropriate available checks for touched files. If checks cannot run, say so. Do not claim a comment-only diff proves behavioral equivalence in languages where comments can be semantic.

Report scope and coverage, mode, deleted comments, protected keeps, VERIFY and RESHAPE findings, restored comments, review reruns, verification evidence, and remaining work. In audit mode, report proposed deletions and explicitly state that no files changed.
