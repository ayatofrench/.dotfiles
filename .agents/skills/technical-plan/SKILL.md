---
name: technical-plan
description: Use when a lead developer or architect provides an ADO Feature, Epic, Release, or Story and needs existing Stories reconciled or missing Stories created with approved, self-contained TDD execution plans.
argument-hint: "<work-item-id> [--force] [--no-clarify]"
disable-model-invocation: true
---

# Technical Plan

Ensure the correct Stories exist and each has a complete technical plan. Announce: “Using technical-plan to plan implementation stories for AB#{id}.”

Invocation: `/technical-plan <id> [--force] [--no-clarify]`. `--force` permits proceeding from a Defining Feature after the explicit warning; it never bypasses a New-state block, draft/batch approval, clarification or bounded assumptions, re-fetch/reconciliation checks, `/analyze`, or promotion gates. `--no-clarify` replaces interactive questions with bounded assumptions but does not bypass confirmation.

## Route and preconditions

Fetch the ID with relations and branch on its actual type. If it is a Bug, reject it before any mutation: Bug-to-Story planning is unsupported. Never infer type from a numeric ID.

- **Feature:** New blocks and routes to `/feature-plan`; Defining warns and proceeds only with `--force`; Defined proceeds; Planning+ warns and reconciles.
- **Epic:** plan direct Stories, or run the Feature flow for child Features.
- **Release:** update existing child Stories and add only proven missing scope.
- **Story:** reconcile and re-plan that Story only.
- Any other type: stop without mutation.

Resolve ADO project from `CLAUDE.md`; ask if absent. ADO is the persisted source of truth. Re-fetch immediately before every mutation and fail closed on ambiguous targets.

## Workflow

1. Read the complete target, business-source artifacts, and existing relations. Resolve one BAC owner per Story: the target Feature, the applicable child/originating Feature for Epic/Release planning, or the existing Story's recorded owner. If a direct Story has no resolvable BAC owner, preserve valid existing mappings and use `[Derived]` for independently justified criteria; never invent a parent BAC set. Do not edit business requirements.
2. Load `shipyard.yaml`, defaults, granularity, orchestration exception, and discovery procedure from [discovery-and-decomposition.md](./references/discovery-and-decomposition.md).
3. Explore the actual repository before planning, including relevant repo-local glossary/ADRs, and inline every applicable conclusion. Ask one technical question at a time; never plan from assumptions.
4. Propose mode and provenance (explicit/default/escalated), delivery shape and independently verifiable outcome per Story, context-fit proposal risk, prefactor decision, blockers with concrete reasons, rejected split/merge alternatives, points, create/update intent, and stable topological order. Explicit shipyard mode wins; absent an explicit mode, retain the configured default/escalation and orchestration behavior. Obtain lead-dev approval before any ADO write.
5. Draft every complete Story specification in memory using [story-spec-and-clarify.md](./references/story-spec-and-clarify.md). Required literal headings include `<h2>TDD Structure</h2>` and `<h2>Execution Plan</h2>`.
6. Run Clarify one question at a time. All clarification answers, revised specs, tags, and logs remain in memory until every full clarified Story spec is presented and explicitly confirmed. With `--no-clarify` or no respondent, draft bounded assumptions instead; confirmation is still required before write.
7. Confirm sensitive tags and the entire batch draft. Verify before writing that Story TACs cover the applicable BAC set for every resolved BAC owner, every Story has bidirectional AC↔test↔task traceability, the dependency graph is acyclic, and expand→migration batches→contract ordering is valid. Then execute [ado-write-and-handoff.md](./references/ado-write-and-handoff.md); verify every persisted spec, field, and relation before `/analyze`, and promote only if all pass.
8. Promotion requires a runtime-confirmed operation and field mapping. `board.types.<type>.trigger`/`board.trigger` describes placement intent and is never a `System.State` value. If mapping is unavailable, leave placement/state unchanged and report ready-to-promote.

## Non-negotiable Story contract

Each Story is self-contained from only ADO Story + checked-out repo. Its declared outcome includes all required layers and is verifiable by a demo or automated/mechanical proof. Inline every decision, data shape, contract, error behavior, test, and ordered task; only repo `path::symbol` and parent `AB#` pointers are allowed. Dependencies sequence work but cannot outsource design or context. Each Execution Plan step names its test file and a repository-verified run command. Files list exact functions/classes/sections.

Every Technical AC maps with `[BAC #N]` against the Story's persisted BAC owner or with `[Derived]`; every AC has tests and tasks, and every test/task maps back. Store Technical AC in `Microsoft.VSTS.Common.AcceptanceCriteria`, 2–3 sentence summary in `Custom.StorySummary`, and preserve exact canonical headings and fields.

Canonical generated sections are reconciled and history-preserving: one owned section, current contradictions removed, unrelated user content and earlier dated logs retained. Preserve unrelated tags. Retry must not duplicate work items, sections, links, or identical decision logs.

## Boundaries

No code execution, prototypes, implementation artifacts, worktrees, PRs, non-ADO publication, tracker setup, new statuses, or business-spec edits. Retain the configured planning mode. Never auto-delete, close, unparent, demote, or move extra/stale Stories. Existing active/enqueued Stories keep their state and placement on rerun. State, board placement, and tags are distinct; preserve exact canonical fields/headings and exact repository paths.

## References

| Read | Purpose |
|---|---|
| [discovery-and-decomposition.md](./references/discovery-and-decomposition.md) | Shipyard defaults, code discovery, modes, DAG |
| [story-spec-and-clarify.md](./references/story-spec-and-clarify.md) | Exact Story schema, completeness, Clarify, sensitive tags |
| [ado-write-and-handoff.md](./references/ado-write-and-handoff.md) | Deterministic reconciliation, staged writes, analyze and promotion |
