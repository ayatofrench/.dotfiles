# ADO Business Artifact

ADO is the persisted source of truth. Build the complete draft in memory, present it, and obtain confirmation before writing. Re-fetch immediately before every create, update, relation, or state mutation. If the target/type or relevant persisted content changed and cannot be reconciled uniquely, stop rather than guess.

## Feature schema

For a Feature, reconcile one copy of each owned section in `System.Description`:

```markdown
## Problem Statement
{what and why}

## User Personas
{roles, access, exclusions}

## User Workflows
{steps and observable failure outcomes}

## Business Acceptance Criteria
1. [BAC #1] GIVEN ... WHEN ... THEN ...

## Constraints
{deadline, compliance, dependencies}

## Out of Scope
{explicit exclusions}

## Business Value: {N}
{business justification}

## Source
{transcript reference or freeform intake}
```

Also write:

- Business AC to `Microsoft.VSTS.Common.AcceptanceCriteria`.
- A 2–3 sentence plain-language gist to `Custom.FeatureSummary`.
- Confirmed score to the existing custom Business Value field.
- `[INCOMPLETE]` on unresolved material sections.

Do not rename fields or create substitute fields.

## Bug defect-intake schema

For a Bug, reconcile one copy of these sections in `System.Description`:

```markdown
## Business Impact
{affected users, frequency, urgency, workaround}

## Observed Behavior
{what the user can observe}

## Expected Behavior
{the intended observable outcome}

## Reproduction
{preconditions and shortest reproducible user workflow}

## Defect Acceptance Criteria
1. [BAC #1] GIVEN ... WHEN ... THEN ...

## Constraints and Non-Goals
{compliance, deadline, explicit exclusions}

## Source
{transcript reference or freeform intake}
```

Mirror current defect criteria into `Microsoft.VSTS.Common.AcceptanceCriteria` only when that field exists on the fetched Bug. Do not write `Custom.FeatureSummary`, Business Value, or any other Feature-only field to a Bug. Do not invent a replacement custom field. If a required Bug field is unavailable, keep the draft in-session and report the unsupported write rather than partially mutating the item. Bug completion does not change state and has no `/technical-plan` handoff.

## Stable BAC identity

Persist labels exactly as `BAC #N`; downstream technical criteria map them as `[BAC #N]`.

- Once issued, a number is immutable and never reused.
- A new criterion receives `max(all numbers ever issued) + 1`, including retired numbers found in logs.
- If one criterion is split, the direct continuation keeps the old number; every additional criterion receives a new number.
- If criteria merge, choose the surviving criterion deliberately and retire the others.
- Removed and merged-away numbers remain retired and are recorded in the dated Clarifications log with the reason.
- Rewording a criterion without changing its business identity keeps its number.

## Reconciliation

Generated sections are canonical, reconciled, and history-preserving—not append-only. On each confirmed write:

1. Re-fetch and identify exactly one target.
2. Rewrite owned current sections so stale text and contradictions are removed.
3. For a Feature, mirror the same current BAC set into the Acceptance Criteria field. For a Bug, mirror only when that field exists on the fetched work-item schema.
4. Preserve unrelated user-authored sections and all prior dated Clarifications/Assumptions blocks.
5. Preserve every unrelated tag.
6. Upsert rather than duplicate generated sections, BACs, relations, and identical log entries.

State, board placement, and tags are distinct. A board trigger configuration is not a `System.State` value. Use only runtime-confirmed operations/field mappings for a requested state or placement mutation; otherwise leave it unchanged and report the limitation.
