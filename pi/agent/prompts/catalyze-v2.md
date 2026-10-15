---
description: Run Catalyze v2 workflow (board, status, pickup, execute/review routing, finish)
---
Use the `catalyze-v2` skill for this request.

Treat the following as the exact command arguments for `/catalyze-v2`:
$@

Requirements:
- Follow the skill invocation/routing rules exactly.
- If arguments are empty, show usage plus current run status (if any active run-state exists).
- Delegate implementation with blocking `worker()` calls and review with blocking `reviewer()` calls; independent calls emitted together run concurrently.
- During execution flow, enforce interleaved review gates between implementation rounds.
