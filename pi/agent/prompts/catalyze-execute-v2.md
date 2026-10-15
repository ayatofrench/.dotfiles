---
description: Execute Catalyze tasks from run-state (supports --task T{N} re-execution)
---
Use the `catalyze-execute-v2` skill for this request.

Treat the following as the exact command arguments for `/catalyze-execute-v2`:
$@

Requirements:
- Follow task dependency ordering and run-state updates from the skill.
- Use subagent-based execution/review orchestration per skill guidance.
- For implementation tasks, always use `agent: "worker"`.
- Interleave reviews as a gate between implementation rounds (run one eligible round, then stop for review/approval before continuing).
- Gate checklist must explicitly include: lint, typecheck, tests, and build.
- Use blocking `worker()` and `reviewer()` calls; independent calls emitted together run concurrently.
