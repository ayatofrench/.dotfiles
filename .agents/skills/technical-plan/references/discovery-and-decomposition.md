# Discovery and Decomposition

## Planning configuration and precedence

Load `shipyard.yaml` from the checked-out repository, or through the orchestrated GitHub Contents path. Honor configured values; use these exact defaults only when file/key is absent:

| Key | Default |
|---|---|
| `planning.mode` | `one_story_per_feature` |
| `planning.story_target` | `3` |
| `planning.create_epic_when_independent` | `true` |

`story_target` is soft, never a cap. An explicitly configured `planning.mode` wins. In explicit `one_story_per_feature`, produce exactly one Story; tracer-bullet increments, prefactors, and expand→migration→contract work remain internal TDD/Execution Plan stages. In explicit `epic_with_stories`, Stories may be end-to-end slices, independently verifiable enabling work, or expand-contract stages. When the mode key is absent, retain the current default: propose escalation from `one_story_per_feature` to `epic_with_stories` only when `create_epic_when_independent: true`, scope has genuinely independent chunks, and the lead developer approves.

Prefer tracer-bullet vertical slices that deliver an independently verifiable outcome across every layer that outcome requires. Outside a split-capable mode, dependent changes sharing types, APIs, data flow, files, or ordering belong in one Story. In split-capable mode, a dependency may cross Stories only when each Story satisfies a permitted delivery-shape contract, remains independently verifiable, and has a concrete blocking edge; active co-edits of the same file/lines still collapse. Never split merely by technical layer.

### Delivery shapes

- **End-to-end:** the thinnest coherent vertical slice with a demo or automated/mechanical proof; it contains every layer required for that outcome, not necessarily every system layer.
- **Enabling prefactor:** constrained prerequisite work separated only when it is independently verifiable and genuinely unblocks a named successor. Its `[Derived]` TAC states the measurable outcome, exact seam/target, test evidence, and named unblock.
- **Expand:** introduces the new contract/schema/path while preserving old and new behavior concurrently.
- **Migration batch:** a bounded set of consumers/data moved to the expanded form, with explicit compatibility behavior and objective batch verification.
- **Contract:** removes the old form only after every required migration; objective completion/removal conditions are mandatory, and all required migration Stories block it.

Never create an empty “integration” Story. In split mode, separate stages only when each satisfies its shape contract and can be independently verified. In one-Story mode, label the Story `End-to-end; expand-contract executed within this Story` and express stages internally.

### Orchestration exception

When `orchestration.enabled: true`, the convoy uses a cumulative integration branch in dependency order. Unless an explicit `planning.mode` says otherwise, favor `epic_with_stories`. Orchestration changes sequencing and dispatch constraints only: a type/model, API, or data-flow boundary becomes a separate Story only when it has a permitted delivery shape, an independently verifiable outcome, and a concrete ADO blocking edge. Otherwise keep it inside the vertical slice; always collapse active co-edits of the same file/lines. Story Points and risk tags remain required because the orchestration pilot uses them. Do not claim atomic dispatch.

## Repository discovery

Obtain actual signatures, schemas, call sites, contracts, test patterns, and target tooling before questions or drafts.

1. Read app/root `CLAUDE.md`, the `GUIDELINES.md` and `.claude/rules/` constitution it points to, applicable package/CI configuration, and relevant repo-local glossary/ADRs.
2. If AMN Knowledge Platform MCP tools are available, make one scoped `search_code` probe. On relevant results, use `search_code`, `find_symbol`, callers/callees, dependencies, and related context.
3. If tools are absent, fail, or have no useful index, silently inspect files directly. KP is an optional local accelerator; never ask the user about it.
4. Confirm load-bearing KP signatures against current files when index staleness is possible.

Read models, services, routes, components, neighboring tests, and all affected layers. Inline glossary/ADR conclusions and contracts in each Story: no implementer may be required to open those documents.

## One-question-at-a-time Q&A

Ask one question per turn, preferably with a recommendation and alternatives:

- Exact approach, extension point, and prefactor necessity.
- Inputs/outputs, status/error contracts, data model, migration, and expand-contract conditions.
- Vertical outcome versus layer boundary; edge cases classified as required, deferred, or impossible.
- Access, audit, PII/PHI, retention, idempotency, retry, and failure behavior.
- Test proof, sequencing, concrete blocker reasons, points, split/merge, and context-fit risk.

Wait for each answer. Keep accepted decisions in memory. Ask granularity/split questions only when the effective mode permits a choice; never negotiate away explicit `one_story_per_feature`.

## Business-source ownership

Resolve the planning target separately from each Story's BAC owner. A Feature target owns its BAC set. For an Epic or Release, resolve the applicable child/originating Feature per Story and never combine colliding BAC namespaces in one Story. For a direct Story re-plan, use its recorded business source or valid existing mappings; if none resolves, do not invent BACs and use only justified `[Derived]` criteria. Persist both planning target and BAC owner in Context, and validate coverage grouped by owner.

## Dependency graph and proposal

A predecessor relation is allowed only for a concrete blocking compile, schema, contract, runtime, or rollout reason. Dependencies provide sequence only and cannot outsource design/context. Use Related for non-blocking shared context; never encode preference ordering as a dependency. Detect cycles before approval and again after writes. Stable order is topological layer first, then lead-approved order within a layer; create/update blockers first.

Present mode and provenance, parent shape, Story titles/scopes, delivery shape and verifiable outcome, BAC coverage, points, required layers, prefactor/expand decisions, blockers and reasons, context-fit proposal risk, rejected split/merge alternatives, topological order, and existing update candidates. Present each full Story draft individually, then the whole batch. Do not mutate ADO until the lead developer explicitly approves all full clarified specs and reconciliation intent.
