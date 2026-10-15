---
name: ado-board-cli
description: Lightweight Azure DevOps Boards helper via Azure CLI for reading/updating stories without ADO MCP. Use when asked to read stories, update story state/assignment/tags, or post board comments.
---

# ADO Board CLI Helper

Use `${CLAUDE_SKILL_ROOT}/scripts/ado_board.py` for concise board operations.

## Why

- avoids noisy Azure DevOps MCP payloads
- uses existing `az` + `azure-devops` extension auth/session
- outputs a compact story summary by default

## Setup

```bash
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py setup \
  --org https://dev.azure.com/<org> \
  --project <project>
```

Optional (recommended): set `AZURE_DEVOPS_EXT_PAT` in shell profile to avoid interactive prompts.

## Common Commands

```bash
# List my open stories (default type: User Story)
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py list --mine --limit 20

# List stories under a parent/epic
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py list --parent 123456 --limit 50

# Show one story (includes description by default)
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py get 123456

# Show one story without description
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py get 123456 --no-description

# Update state + tags
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py update 123456 \
  --state "In Progress" \
  --add-tag pipeline:in-progress

# Assign + add comment
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py update 123456 \
  --assigned-to "Jane Doe" \
  --comment "Picked up for implementation"

# Add standalone comment
uv run ${CLAUDE_SKILL_ROOT}/scripts/ado_board.py comment 123456 "Blocked by missing API key"
```

## Notes

- `list` uses WIQL and prints a compact table.
- `get`/`update` target a specific work item id.
- `get` includes `Description` by default (use `--no-description` to suppress).
- Use `--json` for machine-readable normalized output.
- Use `--org`/`--project` flags to override defaults per command.
