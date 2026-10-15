---
description: Interactive Catalyze review dashboard/task review/approve/fix/reject
---
Use the `catalyze-review-v2` skill for this request.

Treat the following as the exact command arguments for `/catalyze-review-v2`:
$@

Requirements:
- Follow review state transitions and finish guard rules from the skill.
- In review phase, use the `reviewer` subagent only for all review analysis/re-review work.
- Do not fan out into multiple specialized review subagents during review phase.
- Treat `reviewer()` as blocking and use its returned result before finalizing status.
