# Runtime Contract

## Spec-read-only mutation boundary

Analyze reads ADO and repository evidence but makes no specification, relation, state, board, or code changes. A successful run has exactly:

1. one appended dated report comment; and
2. one `System.Tags` update containing the full tag list.

Before mutation, re-fetch the item. If the work item type or analyzed description/Acceptance Criteria changed, discard the result and restart. Compute the final tags once in memory from the re-fetch: split the full existing list, preserve unrelated tags (including `sensitive:*`, `scope:*`, source, and pipeline tags), remove both gate tags, add exactly one of `analyze:pass` or `analyze:critical`, and send the full list once.

For retry safety, use the report timestamp/run identity and exact content to detect whether the append already succeeded. Never append an identical report twice. Re-fetch tags before retry and do not perform another update when they already equal the computed full list.

State, board placement, and tags are distinct. Analyze does not promote anything and never interprets `board.types.<type>.trigger` or `board.trigger` as `System.State`.

## Expected webhook behavior — unverified locally

The following is the expected integration contract and was not verified locally by this skill documentation:

- On a Ready-for-Dev move or trigger/resume-tag event, the Vulcan webhook is expected to inspect `System.Tags`.
- `analyze:critical` is expected to block enqueue and cause a blocking comment.
- `analyze:pass` and no analyze tag are expected not to block; pass is not expected to be mandatory.
- Enforcement is expected in the webhook trigger path, not a `shipyard.yaml` stage gate.

Do not claim this behavior has been runtime-verified without starting the applicable service and exercising the actual endpoint/event in that environment.

## Tools

- `wit_get_work_item(expand="all")`: fetch complete Story and re-fetch before writes.
- `wit_add_work_item_comment`: append the single report.
- `wit_update_work_item`: make the single full-list tag update only.
