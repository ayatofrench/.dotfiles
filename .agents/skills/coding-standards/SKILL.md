---
name: coding-standards
description: Multi-language coding standards and design taste. Use when working on TypeScript or Python; when adding or changing domain models, modules, adapters, parsers, typed errors, async workflows, tests, type contracts, Cloudflare Workers/Effect (TS), or FastAPI/SQLAlchemy/Alembic (Python); or when another engineering skill needs the user's coding standards.
---

# Coding Standards

Use these standards while designing and editing code. They encode the user's
taste: correctness first, precise domain modeling, typed failures, deep modules,
explicit boundaries, real-seam tests, strict type contracts, and boring
operational safety.

This skill is a **two-layer index**:

1. **Layer 1 — language-agnostic principles** live in `topics/` (one file per
   concern) plus the shared `VOCABULARY.md`. These state *what and why*. Their
   code snippets are TypeScript *illustrations* of the principle.
2. **Layer 2 — language-specific mechanism** lives in `langs/<lang>/`:
   `CONTRACTS.md` (type-system rules + escape hatches), `IDIOMS.md` (the
   common-miss checklist), and optional `FRAMEWORKS.md` / runtime-specific
   files. These state *how* in your language.

**Always load both layers** for the languages actually touched. Never apply a
TypeScript mechanism (Effect, `as`, `AbortSignal`, JSDoc) to Python, or a
Python mechanism (pydantic, `Protocol`, alembic) to TypeScript. Apply the
principle through *your* language's idiom.

## Core tenets

- Correctness, safety, debuggability, boundary integrity, and test integrity come before convenience.
- Local conventions matter when they are compatible with these standards.
- Parse boundary input before it reaches core logic; pass refined/domain values inward.
- Model invariants in types, constructors, parsers, and transitions.
- Model expected failures in typed channels; reserve exceptions/throws for defects and boundary translation.
- Design deep modules with intentional seams, small interfaces, and explicit dependencies.
- Verify observable behavior through real seams.
- Keep type contracts strict, local, documented, and boring.
- Improve changed paths without forcing broad migrations unless explicitly requested.
- Do not design for backwards compatibility, migrations, rollout, backfill, dual-write/read paths, or deployment sequencing unless the user explicitly asks. Treat new designs as the desired target state, not a migration plan.

## Non-negotiables (language-agnostic)

These are not aesthetic preferences. When they conflict with existing code, preserve compatibility at the seam and improve the changed path rather than copying the violation.

- Untrusted, serialized, persisted, or framework-shaped input is parsed before core/service logic sees it.
- Decoded data is not trusted with a raw cast (TS `as Type`, Python `# type: ignore` on boundary input, `model_construct` on untrusted data).
- Expected failures are visible in a typed channel, not hidden in raw exceptions/rejections.
- Secrets do not enter errors, logs, traces, metrics, snapshots, or panic/repr summaries.
- Raw platform bindings and framework types stay at composition seams or tightly local External Adapter Modules.
- Dependencies are explicit; hidden globals and ambient time/randomness/IDs do not drive service behavior.
- Tests prove observable behavior through module interfaces or real seams; module mocks and method spies are out.
- Type escape hatches are local, justified (`SAFETY:`), and hidden behind precise interfaces.
- Async work is owned: awaited/returned/collected or handed to explicit detached-work machinery (TS promises, Python `asyncio` tasks).
- Broad migrations require explicit user intent.
- Backwards compatibility, rollout, deployment sequencing, data backfills, and dual-write/read paths require explicit user intent.

## How to apply the standards

1. **Audit the local codebase.** Before choosing a library, pattern, External Adapter Module shape, schema style, error representation, test strategy, observability mechanism, or module layout, inspect until the existing choice for each touched concern is identified or confirmed absent. (Catalyst standards are uneven across `greenlight-api` / `amanda` / `amncomm`; always check the touched package.)
2. **Detect the languages** of the change (see *Language detection* below).
3. **Classify the concerns** touched: domain state, parsing, errors, observability, modules, async, tests, type contracts, plus any runtime/framework concern (Cloudflare/Effect for TS; FastAPI/SQLAlchemy/Alembic for Python).
4. **Load every relevant `topics/` file** matching the concerns.
5. **Load every detected language's** `langs/<lang>/` mechanism: always `CONTRACTS.md` + `IDIOMS.md`, plus any framework/runtime file whose triggers match.
6. **Apply safety standards before local convention.** Follow established architecture where compatible. When local convention violates a non-negotiable, isolate compatibility at the boundary and improve the changed path.
7. **Prefer the smallest coherent improvement.** Do not start unrelated migrations, backwards-compatibility paths, rollout plans, backfill plans, or deployment sequencing. Do not add abstractions, External Adapter Modules, Service Modules, libraries, workflows, or config layers without a concrete reason.
8. **Verify through the right seam.** Tests should observe outcomes at the module or system interface that callers use.
9. **Name trade-offs.** If a standard cannot be fully applied without broad migration, state the compatibility constraint and the local improvement made.

## Language detection

Detect the language(s) of the change from the **changed files' extensions** by
majority count in the diff:

| Extensions | Language | `langs/` dir |
|---|---|---|
| `.ts` `.tsx` `.mts` `.cts` | TypeScript | `langs/typescript/` |
| `.py` `.pyi` | Python | `langs/python/` |

Rules:

- **Mixed-language changes** (e.g. a TS frontend + Python backend in one PR) →
  load **both** langs dirs and both layers. Apply each mechanism only to its own
  language's files.
- **Unknown / no language** (docs, config, infra) → load only the agnostic
  `topics/` that match the concerns; skip `langs/`.
- **Explicit override** beats detection: a caller-provided language arg (e.g.
  `--lang python`), or the review target's own instruction. Use it when present.
- Framework files (e.g. `langs/typescript/CLOUDFLARE_ARCHITECTURE.md`,
  `langs/typescript/EFFECT.md`) are loaded **only** when the change touches that
  runtime — listed in the TS routing table below.

## Topic routing (Layer 1 — agnostic principles)

Load the `topics/` files whose triggers match the task. Code snippets inside are
TypeScript illustrations; apply the principle through your detected language's
mechanism (Layer 2).

| If the change touches... | Load... |
|---|---|
| Shared coding-standard terms, adoption language, failure/boundary/domain/module/runtime vocabulary | [`VOCABULARY.md`](VOCABULARY.md) |
| Domain values, invariants, branded/refined types, value classes, state machines, lifecycle transitions, optionality, exhaustive variants, persisted lifecycle constraints | [`topics/DOMAIN_MODELING.md`](topics/DOMAIN_MODELING.md) |
| Expected failures, custom errors, not-found semantics, cancellation classification, startup config diagnostics, catch/classification | [`topics/ERROR_HANDLING.md`](topics/ERROR_HANDLING.md) |
| Tracing, logging, telemetry, safe summaries, secrets, redaction, preserving reporting/correlation hooks | [`topics/OBSERVABILITY.md`](topics/OBSERVABILITY.md) |
| Domain Modules, Service Modules, External Adapter Modules, interfaces, seams, dependency injection, functional core/shell, resource ownership | [`topics/DESIGNING_MODULES.md`](topics/DESIGNING_MODULES.md) |
| HTTP/RPC/queue/storage/env parsing, DTOs, codecs, projections, config, runtime-hop payloads | [`topics/BOUNDARIES_AND_PARSING.md`](topics/BOUNDARIES_AND_PARSING.md) |
| Cancellation, task/promise ownership, concurrency, idempotency, transactions, retries, workflows, detached work | [`topics/ASYNC_AND_WORKFLOWS.md`](topics/ASYNC_AND_WORKFLOWS.md) |
| Tests, property tests, real seams, persistence/runtime verification, risk-matched evidence | [`topics/TESTING_AND_VERIFICATION.md`](topics/TESTING_AND_VERIFICATION.md) |

## Language routing (Layer 2 — mechanism)

### TypeScript (`langs/typescript/`)

| If the change touches... | Load... |
|---|---|
| Any TypeScript code (always) | [`langs/typescript/CONTRACTS.md`](langs/typescript/CONTRACTS.md) + [`langs/typescript/IDIOMS.md`](langs/typescript/IDIOMS.md) |
| Workers, bindings, Durable Objects, Agents, D1, KV/R2, Queues, Workflows, workerd, service bindings, runtime hops | [`langs/typescript/CLOUDFLARE_ARCHITECTURE.md`](langs/typescript/CLOUDFLARE_ARCHITECTURE.md) |
| Effect Services/Layers, typed errors, Schema, Redacted, Effect testing/RPC | [`langs/typescript/EFFECT.md`](langs/typescript/EFFECT.md) |

### Python (`langs/python/`)

| If the change touches... | Load... |
|---|---|
| Any Python code (always) | [`langs/python/CONTRACTS.md`](langs/python/CONTRACTS.md) + [`langs/python/IDIOMS.md`](langs/python/IDIOMS.md) |
| FastAPI, Starlette, request/response models, lifespan, dependencies | (covered in `langs/python/IDIOMS.md` — "Specifics you'll see in catalyst"; a `FRAMEWORKS.md` splits out when it grows) |
| SQLAlchemy, Alembic migrations, ORM models vs domain types | (covered in `langs/python/IDIOMS.md` — "Migrations (alembic)" + "Boundary / parsing") |

> Adding a language = create `langs/<lang>/CONTRACTS.md` + `langs/<lang>/IDIOMS.md`
> (plus an optional `FRAMEWORKS.md`). Add a row to *Language detection* and a
> section here. **Do not duplicate the principle topics per language** — they are
> written once in `topics/` and apply to every language through your mechanism.

## Strong defaults

Use the repository's established choice when it exists and satisfies these
standards. When no established choice exists, load the topic file that owns the
principle (Layer 1) and your language's mechanism file (Layer 2), and follow
their strong defaults.

Do not treat this root file as enough context for library, runtime, schema,
error, testing, or toolchain choices.

## Rejected framings

- **"The existing code raises/throws, so new expected failures can raise."** Preserve compatibility at boundaries; do not copy unsafe failure contracts into new local logic.
- **"Validation is enough."** Parsing must return the refined value and pass it inward.
- **"A wrapper is architecture."** A pass-through module earns its keep only when it hides complexity, owns policy, or translates across a real seam.
- **"Mocks make tests isolated."** Module mocks isolate the wrong thing. Replace behavior through real seams.
- **"Types are proof."** Serialized data, DB rows, and runtime-hop payloads become less structured at runtime. Parse them.
- **"Future flexibility justifies an interface."** A seam is real when behavior varies, a boundary translates, or tests substitute through an intentional seam.
- **"A lint/type suppression is a fix."** Suppressions must be targeted and explain the safety invariant.
- **"The TS example in a topic file prescribes a TS mechanism to my non-TS code."** It does not. Apply the principle through your language's idiom; the TS snippet is an illustration only.