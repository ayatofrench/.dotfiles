# TypeScript Idioms & Common-Miss Checklist

> **TypeScript mechanism file.** Loaded by `coding-standards` when the change
> touches TypeScript. Pair with the agnostic principles in `../../topics/` and
> `../../VOCABULARY.md`.

The language-specific ways the principles trip you up in TypeScript. These are
the traps to look for; each maps back to an agnostic principle that owns the
*why*.

## Type escape hatches that erase proof

- `JSON.parse(...) as Type`, `Response.json() as Type`, `req.body as Type`,
  DB-row casts, `arr[index]!` — **validated-but-not-parsed**. Validate/reparse
  boundary input; keep the refined value and stop re-validating defensively.
- `as const` assertions vs non-null assertions: prefer `as const`; never use
  `!` to wave away a possible absence.
- `any` and `// @ts-ignore`/`// oxlint-disable-next-line no-explicit-any`: must
  be local, targeted, and carry a `SAFETY:` justification. Broad suppressions
  that admit changed code weaken the contract.
- Catch variables and rejection reasons are `unknown` until classified.

## Promise / cancellation

- **Floating promises**: created but not awaited/returned/collected/handed to
  detached-work machinery. Owned-or-documented.
- **Dropped `AbortSignal`**: lower-level async fns should accept and propagate
  a caller-owned signal; hidden operation lifetimes are out.
- **Accidental sequential awaits** where work could be concurrent (`Promise.all`
  / `Promise.allSettled`); conversely `Promise.all` where peer failures should
  not abort the group.
- Retryable mutations without idempotency or durable side-effect delivery.

## Boundaries

- Pass-through wrappers that earn nothing — a module earns its keep only when
  it hides complexity, owns policy, or translates across a real seam.
- `Record<string, unknown>` / `Partial<T>` bags leaking into domain logic; prefer
  precise operation inputs.
- DTOs, storage rows, config, and runtime-hop payloads decoded straight into
  trusted types without a parse step.

## Errors / failures

- Expected failures hidden in `throw`/`Promise.reject` instead of a typed return
  channel (Result / tagged error).
- Broad `AppError` unions at module interfaces instead of a precise local
  failure union; broaden only at orchestration/entrypoints.
- Cancellation classified as an ordinary error.

## Secrets / observability

- Secrets reaching `Error.message`, log/trace/metric fields, snapshots, or
  arbitrary serialization (structured logs that spread `...err`).
- Missing redaction before telemetry sinks.

## Modules / contracts

- Mutable exported contracts (non-`readonly` public fields/collections that
  callers can mutate unintentionally).
- `then`出现在 non-promise domain objects (thenable accident).
- Barrels (`utils`/`helpers`/`common`) over direct imports from the owning file.
- `import type`/`export type` omitted for type-only imports.

## Tests

- Tests using module mocks / method spies / implementation details instead of
  real seams (module interface, in-memory adapter, fake collaborator).
- Behavior that remains unproven: a test asserts internal calls, not observable
  outcomes.
- `as Type` inside tests to force shapes the SUT never accepts from real callers.

## Cloudflare runtime (load with CLOUDFLARE_ARCHITECTURE.md)

- Runtime-hop serialization mistakes (bindings, Durable Object storage, D1
  rows, `Request.json()` payloads) decoded with `as`.
- Bindings/framework types leaking past External Adapter Modules.

## Effect (load with EFFECT.md)

- Effect code bypassing established Effect mechanisms: hand-rolled channels,
  Schema bypassed, `Redacted` values unwrapped, Effect tests replaced by mocks.