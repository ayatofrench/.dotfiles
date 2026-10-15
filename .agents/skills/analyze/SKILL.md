---
name: analyze
description: Use when an ADO Story must be statically checked for Ready-for-Dev completeness, bidirectional coverage, constitutional compliance, self-containment, and implementation readiness.
argument-hint: "<work-item-id>"
---

# Analyze

Spec-read-only gate for one ADO Story. Announce: “Using analyze to gate AB#{id} for Ready-for-Dev.” The question is whether a headless run can implement every acceptance criterion using only the complete Story and checked-out repository, without guessing.

## Write budget

Each run performs exactly two writes:

1. Append exactly one dated Analyze Report comment. Never replace or edit earlier comments; the newest report logically supersedes all earlier reports.
2. Perform exactly one full-tag-list update containing exactly one analyze gate tag.

Never write `System.Description`, `Microsoft.VSTS.Common.AcceptanceCriteria`, state, board placement, relations, or code. State, placement, and tags are distinct; a board trigger is not `System.State`.

## Workflow

1. Resolve ADO organization/project from `CLAUDE.md`; ask if missing. Fetch the ID with `expand="all"`, verify its actual type is the target process's Story work-item type (`User Story` or `Story`), and read its entire description, `Microsoft.VSTS.Common.AcceptanceCriteria`, `System.Tags`, state, board metadata, and relations. Reject all other types.
2. Read repository `CLAUDE.md`, the `GUIDELINES.md` and `.claude/rules/` constitution it points to, and path-scoped rules. If absent, record that and do not invent rules. Read target package scripts/config/CI only to validate named commands.
3. Parse the exact `<h2>Technical Acceptance Criteria</h2>`, `<h2>TDD Structure</h2>`, and `<h2>Execution Plan</h2>` sections plus Context, Design, and Files to Create/Modify. When present, parse Planning target, BAC owner (or the legacy Feature context), Delivery shape, Verifiable outcome, and declared Depends on blocker reasons; compare declared blockers with direct ADO predecessor/successor relations. Apply the missing/empty-plan special cases in [detection-details.md](./references/detection-details.md).
4. Build the bidirectional AC ↔ tests ↔ implementation-task matrix. Forward: every AC has at least one test and one task. Reverse: every test and task traces to an AC via `[BAC #N]` or `[Derived]`; report orphans. Resolve every `[BAC #N]` against the persisted/legacy BAC owner and verify that criterion exists there. Validate that dependency links sequence work only and that all required contracts/design remain inline rather than outsourced to another Story.
5. Run all eight passes. [detection-details.md](./references/detection-details.md) is the sole authoritative severity table. Report only confidence ≥80 findings. Collapse a shared root cause into one finding at its highest severity; never report the same ambiguity under both C and H.
6. Assemble the one comment exactly as [report-format.md](./references/report-format.md) specifies.
7. Re-fetch immediately before mutation. Fail closed if the target/type or analyzed spec changed; restart rather than posting stale results.
8. Compute tags once in memory from that re-fetch: preserve every unrelated tag, remove all `analyze:pass` and `analyze:critical`, then add exactly one—`analyze:critical` if any critical finding exists, otherwise `analyze:pass`.
9. Append the report once, then write the complete computed tag list once. On uncertain retry status, re-fetch comments/tags and do not duplicate an identical report or gate tag.
10. Print coverage, severity counts, gate tag, and remediation. Do not move state or board placement.

## Decisions

Story narrowness or context fit is advisory/proposal risk and is never gateable by itself. Missing Delivery shape, Verifiable outcome, or blocker labels on a legacy Story is not itself a finding; report only a concrete A/G/H defect supported by the Story's actual required outcome or dependency. Do not require every Story to cross every layer—only layers required for its declared outcome.

- Critical: set `analyze:critical`; implementation is blocked.
- No critical: set `analyze:pass`; high/medium findings remain advisory.
- Route coverage/design/readiness fixes to `/technical-plan`; route missing business behavior to `/feature-plan`. Clarification occurs there, never here.

Webhook behavior is documented as expected but unverified locally in [runtime-contract.md](./references/runtime-contract.md). Do not claim local webhook verification.

## References

| Read | Purpose |
|---|---|
| [detection-details.md](./references/detection-details.md) | Sole severity authority, eight passes, matrix rules |
| [report-format.md](./references/report-format.md) | Exact appended report and remediation format |
| [runtime-contract.md](./references/runtime-contract.md) | Two-write contract and expected/unverified webhook behavior |
