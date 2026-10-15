---
name: thermos
description: "Launch two read-only reviewer calls in parallel, then synthesize their findings. Use for thermos, double thermo review, or combined bug/security and code-quality branch audits."
disable-model-invocation: true
---

# Thermos

Run two blocking reviewer calls in parallel, then synthesize their returned findings.

## Workflow

1. Determine the review scope from the user request, PR, current branch, or relevant changed files.
2. Save the diff as a file and gather lazy references to relevant files. Keep inline context concise; never paste the full diff or source files into it.
3. Emit both `reviewer()` calls in the same response so Pi executes them concurrently:
   - One task covers bugs, breakages, security, devex regressions, and feature-flag leaks.
   - One task covers maintainability, structure, file-size growth, spaghetti, abstractions, and codebase health.
4. Pass both reviewers the same lazy `files` references and target workspace as `cwd`.
5. After both blocking tool results return, synthesize findings-first, deduplicate overlap, weight consensus, and resolve disagreements with your own judgment.

Return the unified verdict, highest-signal findings, and remaining uncertainty. Do not restate both reviewer outputs wholesale.
