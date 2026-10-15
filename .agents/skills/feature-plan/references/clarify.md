# Mandatory Clarify Sweep

Run after a complete business-spec draft exists and before asking for final completion confirmation. Analyze the re-fetched ADO artifact, not a stale draft.

## Scan and rank

Rate each dimension Clear, Partial, or Missing. Clear means a technical planner can proceed without inventing business behavior.

- Functional boundaries.
- Personas, access, entry points, and workflows.
- Compliance, PHI/PII, consent, audit, and handling expectations.
- Data read/created/changed, source of record, and retention.
- Upstream/downstream integrations and expected business behavior.
- Volume, latency, availability, rollout, and access expectations.
- Empty, invalid, denied, timeout, duplicate, and failure outcomes.
- GIVEN/WHEN/THEN testability.
- Out-of-scope and assumptions.

Rank Partial/Missing items by Impact × Uncertainty; compliance and scope-boundary gaps rank highest, Missing above Partial. Select at most five material questions. Re-rank after each answer.

## Ask one at a time

Each turn contains:

1. A complete interrogative sentence ending in `?`.
2. `Why it matters:` followed by the concrete consequence of guessing.
3. One **Recommended** option and 1–3 alternatives, all in business language.

Wait for the answer before continuing. If the PM stops, defers, or cannot answer, use a narrow, falsifiable least-surprising assumption rather than a silent guess.

## Draft, confirm, commit

Technical-plan clarifications are not relevant here; feature-plan may persist each confirmed business clarification, but must still draft before commit:

1. Integrate the answer into affected canonical sections and BACs, removing contradictory current text.
2. Preserve BAC identity according to the stable numbering rules.
3. Add one non-duplicate entry to the current dated log draft.
4. Present the resulting changes and obtain PM confirmation.
5. Re-fetch immediately before mutation, reconcile, then write `System.Description`, mirrored `Microsoft.VSTS.Common.AcceptanceCriteria`, and any affected canonical field together as supported.

Use one `## Clarifications` section with dated blocks and retain prior dates:

```markdown
## Clarifications
### 2026-07-29
- Q: Should supervisors see only their own messages?
  → A: Yes. (updated User Workflows and BAC #4)
- Retired BAC #6: merged into BAC #4.

### Assumptions (2026-07-29)
- Assumed: notifications are in-app only; SMS and email are out of scope.
```

Never append an identical decision or create another Clarifications section. Rewrite current owned content while retaining historical logs.

## Exit

Every material Missing item must be resolved or explicitly assumed. Keep `[INCOMPLETE]` for unresolved material gaps. For a Feature, ask exactly: “Is this business spec complete and ready for technical planning?” Only “yes” permits the confirmed Defining → Defined transition; otherwise leave state unchanged. For a Bug, ask: “Is this defect intake complete and ready for engineering triage?”, keep state unchanged, and state that `/technical-plan` handoff is unsupported.
