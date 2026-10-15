# ADO Write and Handoff

ADO is the persisted source of truth. Re-fetch immediately before each mutation. Stop when identity, type, relation, or candidate matching is ambiguous.

## Deterministic reconciliation

Re-fetch the parent with relations. Discover possible Stories from IDs in the parent's owned `## Technical Planning` section, direct relations, and existing source/parent tags such as `feature:{featureId}`. These are discovery evidence only: a prior ID, relation, or tag never authorizes an update by itself. Do not invent a tag convention when the parent uses none, and never use fuzzy title/scope matching.

Before mutation, the current proposal must map each planned scope one-to-one to an existing Story ID or to “create new,” and the lead developer must explicitly confirm that mapping. An update candidate is valid only when the confirmed ID resolves to the target process's Story type (`User Story` or `Story`) and still has the expected relation. If related candidates exist but none is confirmed, or candidates overlap, stop for explicit mapping rather than creating or choosing. Create the configured Story type (default `User Story`) only when the confirmed intent is “create new” and reconciliation finds no plausible existing candidate. Apply the same discipline to a parent Epic. Never auto-delete, close, unparent, demote, or move a stale Story. Existing active/enqueued Stories retain state and board placement.

Upsert one `## Technical Planning` section on the Feature/Epic/Release planning target; for a direct Story re-plan, update only that Story's canonical plan and do not add a self-referential parent summary. Rewrite generated summary content while preserving unrelated target content and prior dated logs. Include mode/provenance, BAC owner per Story, delivery shape and verifiable outcome, Story IDs/titles/points, required layers, dependency edges with concrete reasons, prefactor/expand-contract decisions, Q&A/key decisions, total, planner, and date. Never duplicate the section or identical log entries.

## Confirmed staged mutation sequence

Only after all full clarified drafts and the batch are explicitly confirmed:

1. **Reconcile:** re-fetch parent/relations and resolve every target uniquely.
2. **Create/update without triggering:** in stable blocker-first topological order (topological layer, then approved order), create missing items using the configured Story type (default `User Story`) in New and update existing Stories without changing state/placement. Do not trigger implementation.
3. **Write artifacts:** in that same order, reconcile each Story Description; write `Microsoft.VSTS.Common.AcceptanceCriteria`, points, `Custom.StorySummary`, and complete tags. Preserve unrelated tags; include a source/parent tag only when configured or already established on the source artifact, plus inherited source tags, confirmed `sensitive:*`, and `clarified` where appropriate. Otherwise rely on confirmed hierarchy/relations and the owned Technical Planning section; never invent a tag convention.
4. **Write all relations:** parent new items correctly; keep Release-child parents; write every approved predecessor/successor and Related relation, deduped so each relation exists exactly once. Re-fetch and verify before retry.
5. **Planning summary:** for Feature/Epic/Release targets, upsert the one Technical Planning section. Only when the target is a Feature whose immediately re-fetched state is exactly Defined, record the intended Defined → Planning transition and apply it through a runtime-confirmed state operation/mapping; otherwise leave state unchanged. A Defining Feature admitted by `--force` remains Defining and is reported as pending explicit PM completion through `/feature-plan`. Epic, Release, and direct Story entry points do not change parent workflow state; direct Story re-plans add no parent summary.
6. **Batch integrity preflight:** re-fetch the target, every resolved BAC owner, and every Story. Verify all approved specs and canonical fields exist; every approved relation exists exactly once; the DAG is acyclic; each Story persists the correct BAC owner; Story TAC `[BAC #N]` mappings collectively cover the applicable active BAC set for every owner in scope; direct Stories without an owner use only justified `[Derived]` criteria; every Story retains AC↔test↔task traceability; and each Contract is blocked by every required Migration batch with valid expand→migration→contract ordering. On any mismatch, stop and repair/reconfirm before Analyze.
7. **Analyze all:** only after preflight passes, run `/analyze {storyId}` for every Story.
8. **Batch gate and promotion:** if any Story has `analyze:critical`, make no new promotions for any Story; report all findings and return to Clarify/spec correction. Only when every Story has `analyze:pass` may promotion begin. Existing active/enqueued Stories are left untouched.

This order is staged, not claimed atomic. If any write is partial or uncertain, report the confirmed partial state, re-fetch, and do not Analyze or promote until the complete batch is reconciled and preflight passes.

## Board/state fail-closed promotion

State, board placement, and tags are distinct. Resolve intended placement from `board.types.<type>.trigger` when set, else `board.trigger`, but never send that configured trigger string as `System.State` merely because names resemble one another.

Promote only when the live ADO/runtime integration confirms the correct operation and field/value mapping for that work item type. If no such mapping is available, do not mutate state or placement; report each passing Story as **ready-to-promote** with its intended trigger placement. This is report text, not a tag or status. Never create a new status or demote/move active or enqueued Stories on rerun.

## Retry safety

Before every create, update, relation, analyze handoff, or promotion, re-fetch relevant ADO state. On uncertain outcomes, inspect before retrying. Ensure no duplicate work items, owned sections, links, or identical dated decision entries. Fail closed on multiple candidates or changed relations.

## Completion report

Report created and updated IDs separately, points/layers/dependencies, analyze result per Story, Feature transition applied or pending, and promotion applied or ready-to-promote. Do not call the batch handed off when any Story is critical. No business edits or implementation/execution occur in this skill.
