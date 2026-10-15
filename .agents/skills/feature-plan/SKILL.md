---
name: feature-plan
description: Use when a PM or PO provides an ADO work item ID or freeform Feature/Bug intake and needs business requirements defined or refined through code-informed, one-question-at-a-time clarification.
argument-hint: "<work-item-id | 'description'>"
disable-model-invocation: true
---

# Feature Plan

Create or refine a business-language Feature specification in ADO. Announce: “Using feature-plan to refine the business spec for AB#{id}” or “Using feature-plan to scope a new item.”

## Route

1. Resolve the ADO organization/project from `CLAUDE.md`; ask if missing or ambiguous.
2. For a numeric ID, fetch it with relations and route by its actual work item type. Never assume it is a Feature.
3. Existing Features enter the Feature flow. Existing Bugs use the separate defect-intake schema in [ado-artifact.md](./references/ado-artifact.md); Bug handoff to `/technical-plan` is unsupported and must be stated explicitly. Reject other types without mutation.
4. For freeform intake, classify Feature versus Bug, then read `shipyard.yaml` and `planning.allowed_types`; default to `[Feature, Bug]`. Create only an allowed type. This skill never creates Epics or Stories.

State, board placement, and tags are separate controls. Never interpret `board.*.trigger` as `System.State`. Change state only through a confirmed state operation; preserve unrelated tags; do not change board placement here.

## Required workflow

1. Read [discovery.md](./references/discovery.md), inspect the relevant code before asking questions, and silently fall back from the Knowledge Platform to direct repository reads when unavailable.
2. Fetch the current ADO item and read the entire persisted specification. ADO is the persisted source of truth.
3. Ask one business question at a time, preferably with choices. Use the Feature or Bug question set from [discovery.md](./references/discovery.md). Do not ask what the code already answers. Translate every technical fact into user-visible business language.
4. Maintain an in-memory draft using the applicable Feature or Bug schema in [ado-artifact.md](./references/ado-artifact.md). Do not mutate before presenting the draft.
5. Present the complete draft and obtain PM confirmation to commit it. Immediately before every mutation, re-fetch the item and fail closed if its identity/type or relevant content changed ambiguously.
6. Reconcile the canonical fields and owned sections; do not append a second generated section. Preserve unrelated user content, unrelated tags, and prior dated logs while rewriting owned current sections to remove contradictions.
7. Run the mandatory ambiguity sweep in [clarify.md](./references/clarify.md). Ask one question at a time, integrate each confirmed answer into a new draft, and confirm before each commit. Retry must not duplicate sections or identical decision-log entries.
8. For a Feature, ask exactly: “Is this business spec complete and ready for technical planning?” A confirmed New Feature may enter Defining through a validated state operation; only explicit PM completion confirmation permits Defining → Defined. Otherwise leave its state unchanged. For a Bug, ask: “Is this defect intake complete and ready for engineering triage?” Keep its state unchanged and state that `/technical-plan` handoff is unsupported.

## Canonical writes

For Features, store the business spec in `System.Description`, mirror Business Acceptance Criteria in `Microsoft.VSTS.Common.AcceptanceCriteria`, write the 2–3 sentence summary to `Custom.FeatureSummary`, and use the existing custom Business Value field. For Bugs, write only the supported Bug fields defined in [ado-artifact.md](./references/ado-artifact.md); never assume Feature-only custom fields exist. Incomplete material sections carry `[INCOMPLETE]`.

Use reconciliatory, history-preserving writes: replace the current owned canonical section content so stale statements cannot contradict the decision; retain unrelated content and all prior dated Clarifications/Assumptions logs. Re-fetch immediately before `wit_update_work_item` or creation/link/state operations. Retry safely and fail closed on ambiguous targets.

## Invariants

- BAC labels are persisted as `BAC #N`; numbers are immutable and never reused. Technical mapping remains `[BAC #N]`.
- All persisted Feature content and PM questions use business language: no file paths, symbols, component names, endpoints, infrastructure names, or code snippets.
- Draft before commit; clarify and explicit PM completion confirmation are mandatory.
- No technical acceptance criteria, architecture, Story breakdown, code execution, or implementation.

## References

| Read | Purpose |
|---|---|
| [discovery.md](./references/discovery.md) | Code-informed intake and business-language questions |
| [ado-artifact.md](./references/ado-artifact.md) | Canonical ADO schema, BAC identity, reconciliation |
| [clarify.md](./references/clarify.md) | Mandatory ambiguity sweep, logs, and completion gate |
