# Detection Details

This compact eight-pass table is the sole severity authority for Analyze. Do not create another authoritative severity rubric.

| Pass | Detection rule | Default severity |
|---|---|---|
| **A — Coverage** | Technical AC are absent/empty; `[BAC #N]` has no resolvable persisted/legacy BAC owner or does not exist on that owner; an AC lacks a test or implementation task; a declared verifiable outcome lacks demo or automated/mechanical evidence; a stated success condition is absent from the plan; or a concrete layer required for the declared outcome has no AC/test/task coverage. Do not require unrelated layers. | **critical** |
| **B — Constitution** | A concrete plan element violates a locatable MUST/MUST-NOT in `GUIDELINES.md` or applicable `.claude/rules/`. | **critical** |
| **C — Bounded ambiguity** | A vague, partial, placeholder, or unmeasurable requirement is bounded enough that implementation remains fully determined; includes `TODO`, `TKTK`, `[NEEDS CLARIFICATION]`, `[INCOMPLETE]`. | high, advisory |
| **D — Duplication** | The same requirement, AC, test, or task appears more than once. | medium |
| **E — Inconsistency** | Terminology drifts or two statements contradict. | medium |
| **F — AC testability** | An AC lacks a measurable GIVEN/WHEN/THEN or observable assertion. | high, advisory |
| **G — Self-containment** | Required design/spec context is outsourced to an ADR, glossary, docs/spec `*.md`, wiki, Confluence, SharePoint, Drive, “see the design/spec,” or another Story. Repo `path::symbol` is allowed; `AB#` references are allowed only for identity/sequence, never required contracts or design. | **critical** |
| **H — Implementation readiness** | A specific AC is not fully implementable from Story + repo. Identify the concrete locatable missing decision/contract and forced choice. Includes empty/stub TDD rows, unresolved placeholders, missing per-step test file/run command, bare filenames without functions/sections, missing data shape/error behavior, unsupported commands, a declared required blocker with no direct ADO relation, an enabling prefactor without exact seam/verifier/named unblock, Expand without old/new coexistence, an unbounded Migration batch or missing compatibility, and Contract without objective completion/removal conditions or without relations from every required migration. Dependencies cannot outsource contracts/design. | **critical** |

Report only findings with confidence ≥80.

## C/H precedence

Ambiguity alone is C high advisory when its possible meanings are bounded/measurable and no implementation choice is forced. Use H only when a named AC cannot be completed without choosing among unspecified contracts or behavior. Every H finding must state:

- the AC and exact Story location;
- the concrete omitted or contradictory decision/contract; and
- the forced choice (for example, status code A versus B, nullable versus required, or retry versus fail).

A critical omission/contradiction must be concrete and locatable. “The plan feels thin” is not a finding. If one root cause triggers C and H, report it once as H; do not duplicate C/H. More generally, collapse one root cause to one finding at its highest applicable severity.

## Missing-plan special cases

If `<h2>Technical Acceptance Criteria</h2>` or `Microsoft.VSTS.Common.AcceptanceCriteria` is absent or empty, emit one A critical: “no Technical Acceptance Criteria to implement or trace—run `/technical-plan`.” A zero-AC matrix never passes. Require at least one valid criterion marked `[BAC #N]` or `[Derived]`.

If either exact canonical section `<h2>TDD Structure</h2>` or `<h2>Execution Plan</h2>` is absent, emit one A critical: “no complete plan to trace ACs against—run `/technical-plan`.” Skip per-AC coverage/readiness cascades. Other independent, concrete findings may still be reported.

## Bidirectional matrix

Enumerate every criterion from `Microsoft.VSTS.Common.AcceptanceCriteria`, and tests/tasks from TDD Structure, Execution Plan, and Files to Create/Modify.

| AC | Criterion | Tests | Tasks | Covered |
|---|---|---|---|---|
| #1 | GIVEN…WHEN…THEN… | named test(s) | named implementation task(s) | yes/no |

Forward coverage requires at least one test and one task for every AC. Reverse coverage requires every test and task to map to at least one AC. Resolve `[BAC #N]` against the Context BAC owner, or a legacy `Feature: AB#…` owner; verify the numbered criterion exists there. `[Derived]` needs no BAC owner but must identify its constitution/code basis. List orphan tests/tasks as scope creep or missing AC evidence.

## Evidence rules

Read all prose and rows, not headings alone. For B, quote or precisely locate the governing rule and offending plan element. For command readiness, inspect package scripts, per-app config, or CI; do not execute tests and do not infer absent tooling. If the constitution is not present through `CLAUDE.md`, note “not found” and skip B.
