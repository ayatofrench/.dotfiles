# Story Specification and Clarify

## Canonical Story description

Persist a single reconciled copy of these sections. The two highlighted headings must remain literal exact HTML.

```html
<h2>Summary</h2>
{2–3 sentence delivery and rationale}

<h2>Context</h2>
Planning target: AB#{id} — {Feature | Epic | Release | Story} — {title}
BAC owner: AB#{featureId} — Feature — {title} | None
Business AC addressed: BAC #1, BAC #2 | None
Delivery shape: End-to-end | Enabling prefactor | Expand | Migration batch | Contract
Verifiable outcome: {demo or automated/mechanical proof}
Depends on: AB#{id} — {concrete compile/schema/contract/runtime/rollout blocker reason} or None

<h2>Design</h2>
<h3>What exists today</h3>
{repo path::symbol, exact relevant signature/data shape/contract}
<h3>What changes</h3>
{fully determined signatures, data shapes, logic, call sites, errors}

<h2>Technical Acceptance Criteria</h2>
1. [BAC #1] — {criterion}
2. [Derived] — {constitution/code-derived criterion}

<h2>TDD Structure</h2>
| TAC # | Test | Asserts | Implementation |
|---|---|---|---|
| 1 | {named test} | {observable result} | {named task/symbol} |

<h2>Execution Plan</h2>
1. {ordered change} — test: `path/to/test::name` — run: `{verified command}`

<h2>Files to Create/Modify</h2>
- `path/to/file` — {exact functions/classes/sections}

<h2>Story Points: {N}</h2>
```

Mirror Technical AC into `Microsoft.VSTS.Common.AcceptanceCriteria` and Summary into `Custom.StorySummary`.

## Completeness

A headless implementer must need only Story + repository. Inline all decisions, model fields and optionality, request/response/event contracts, status codes, state changes, business logic, edge/failure handling, authorization/audit/retention, and concrete targets. Never point design context to docs, `*.md` specs, transcripts, wiki/Confluence, PR text, or side files. Only repo `path::symbol` and parent `AB#` pointers are allowed.

Every AC has at least one test and implementation task; every test/task maps back to an AC. Use `[BAC #N]` exactly against the persisted BAC owner and `[Derived]` for constitution/code-derived criteria. BAC numbering comes from that owner and is not renumbered here. A Story has at most one BAC owner; Epic/Release batches resolve owners per Story, and a direct Story with no resolvable owner uses justified `[Derived]` criteria rather than invented BACs.

Every Execution Plan step names tests first and an actual command verified against the target package scripts/config/CI. Files name functions/classes/sections, not bare filenames. A dependency sequences work only: the dependent Story must still inline every required contract and design decision rather than outsourcing context to another Story.

### Shape-specific completeness

- **End-to-end:** include all layers required by its declared outcome and prove the integrated behavior. In one-Story mode use `Delivery shape: End-to-end; expand-contract executed within this Story` when applicable, with prefactor and expand→migration batches→contract represented as internal TDD/Execution Plan stages.
- **Enabling prefactor:** include a `[Derived]` measurable outcome, exact seam/target, named test evidence, and the successor/outcome it unblocks. It cannot be speculative infrastructure.
- **Expand:** prove old and new coexist. **Migration batch:** bound consumers/data and state compatibility plus proof. **Contract:** state objective completion/removal conditions and be blocked by every required migration.

Do not require every Story to cross every architectural layer—require every layer needed for its declared outcome. Never create an empty integration Story. Missing these new Context labels on a legacy Story is not, by itself, a critical Analyze finding.

## Clarify before write

Scan each draft for canonical model/fields, source integration/event shape, prefactor necessity, vertical versus layer boundaries, required/deferred/impossible edge classification, expand-contract conditions, layers/files, compliance and PHI, performance/idempotency/retry, failures, AC-test-task coverage, concrete blockers, split/merge alternatives, context-fit risk, and terminology. Rate Clear/Partial/Missing; rank Partial/Missing by Impact × Uncertainty. Ask at most five highest-impact questions, one per turn. If more than five high-impact gaps remain, propose a split only when mode permits rather than thinning the spec.

Each question is a full interrogative, states why guessing matters, and offers a recommended option plus alternatives. Wait for the answer. Rewrite affected AC/TDD/design text in memory and draft one dated clarification entry. Do not write any clarification to ADO yet.

For every unasked/deferred gap, draft a narrow assumption and safe fallback. `--no-clarify` or headless mode records all gaps this way; it does not waive full clarified-spec confirmation.

Use one retained log section:

```markdown
## Clarifications
### 2026-07-29
- [Integration] Chose per-entity topic. → updated TAC #3 and its TDD row.
### Assumptions (2026-07-29)
- [Failure] Assume idempotent upsert by source ID; fallback: consumer dedupe.
```

Do not duplicate identical decisions. Clarify exits only when every AC is clear or backed by a resolution/assumption and has complete test/task coverage. Present each full revised spec and then the batch for explicit confirmation.

## Sensitive tagging

Confirm and add, while preserving unrelated tags:

| Path class | Tag |
|---|---|
| Authentication, authorization, sessions | `sensitive:auth` |
| Billing, payments, financial calculations | `sensitive:financial` |
| PII/PHI handling, access, retention | `sensitive:pii` |

`sensitive:*` is an advisory signal for extra human review, not a merge block by itself. Hard two-distinct-non-author approval requires GitHub branch protection/ruleset, CODEOWNERS, or a required check; do not claim this skill enforces it.
