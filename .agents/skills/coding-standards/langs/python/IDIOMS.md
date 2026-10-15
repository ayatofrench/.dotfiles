# Python Idioms & Common-Miss Checklist

> **Python mechanism file.** Loaded by `coding-standards` when the change
> touches Python. Pair with the agnostic principles in `../../topics/` and
> `../../VOCABULARY.md`.

The language-specific ways the principles trip you up in Python. Each maps back
to an agnostic principle that owns the *why*. Convention in catalyst is uneven
(`greenlight-api` / `amanda` / `amncomm`); **audit the touched package first**
and match or tighten it.

## Boundary / parsing (validated-but-not-parsed)

- `request.json()` / `body` cast straight into a domain object — code does
  `model_validate` but then reads the raw dict elsewhere, or validates without
  keeping the parsed model.
- pydantic `__init__` / `**kwargs` / `model_construct(...)` bypassing validation
  (`model_construct` skips validators — do not use for untrusted input).
- SQLAlchemy rows decoded by attribute access into domain logic without a
  mapping step (treating the ORM row as the domain type).
- `json.loads(s)` to a bare `dict[str, Any]` that flows inward unrefined.

## Errors / failures (principle: expected failures are part of the contract)

Python raises by default — the principle "expected failures in a typed channel"
maps to **intentional, classified exceptions at boundaries**, not returning
`None` or swallowing.

- `except Exception:` / bare `except:` that swallow expected failures and
  continue; broad catches that turn a typed failure into an opaque defect.
- `except ...: pass` / `raise None` patterns that drop the causation chain — at
  minimum `raise ... from err` to preserve the cause.
- Expected domain outcomes (not-found, denied, already-exists) raised as generic
  `Exception`/`ValueError` without a typed domain exception class — the caller
  can't branch semantically. Define a small exception hierarchy per module
  (analogue of TS precise error union).
- Cancellation translated into an ordinary error (catching `asyncio.CancelledError`
  and re-raising as `MyError`); let cancellation propagate.
- `return None` to mean "not found" where the caller is forced to remember —
  prefer a typed result/exception so absence is visible in the contract.
- External Adapter Module equivalent: catch HTTP/vendor exceptions at the client
  seam, classify `unknown` status bodies, translate to typed domain failures.

## Async / concurrency (principle: owned tasks, caller-owned cancellation)

- `asyncio.create_task(...)` without keeping the handle or awaiting/`gather`ing
  it — the Python **floating promise**; the task can be GC'd or swallow errors.
- Fire-and-forget tasks whose exceptions are never surfaced (`await` or
  `asyncio.gather(*tasks, return_exceptions=...)`).
- Blocking I/O inside async paths (`requests.get`, `time.sleep`, sync `open`) —
  use `httpx.AsyncClient` / `asyncio.sleep` / `aiofiles` or `run_in_executor`.
- Retryable HTTP/mutations without idempotency keys or durable side-effect
  delivery; `requests` without timeout (always pass `timeout=...`).
- Missing `asyncio CancelledError` handling in cleanup (`finally` blocks that
  block cancellation).

## Secrets / observability

- Secrets in exception messages, `repr(obj)`, `logger.info(f"...{token}")`,
  structured logs that spread `**event_dict` containing credentials.
- Fastapi: returning a model whose `repr`/`str` includes a secret, or logging the
  request body.
- Missing redaction (catalyst pattern: a redacting serializer / pydantic
  `SecretStr`) before telemetry or error surfaces.

## Modules / contracts

- Mutable default args (`def f(x=[])`); class-level mutable defaults shared
  across instances.
- `Optional[X]` misuse (means `X | None`, not "optional parameter") — use
  `= None` default; do not conflate with `Optional`-the-type for clarity.
- Pass-through client wrappers that earn nothing — a vendored `EVerifyClient`
  Protocol + stub must hide complexity or own policy, not just forward.
- `dict[str, Any]` bags passed across module boundaries instead of typed
  dataclass/pydantic operation inputs.
- `import *` and module-level side effects (registering handlers on import).
- Broad `__all__` barrels; import from the owning module.

## Migrations (alembic — catalyst-specific)

- **Duplicate revision ids / multiple heads**: two files declaring the same
  `revision =` or both pointing `down_revision` at the same parent →
  `alembic heads` shows >1 head → deploy breaks. (Seen in production PRs.)
- Editing an existing migration file **in place** (renumbering its `revision`)
  after it may have been stamped in a environment — changes what a revision id
  *means*. Add a new migration; don't rewrite history unless you've confirmed no
  env stamped the old id.
- Migration that doesn't round-trip (`upgrade` fine, `downgrade` broken or
  missing), or that performs a data backfill without an idempotent guard.
- ORM model and migration schema drift (column in code, not in migration, or
  vice-versa).

## Tests (principle: real seams, observable behavior)

- `unittest.mock.patch` / `mock.Mock` substituting internal dependencies instead
  of injecting a real fake through a `Protocol` seam (the Python "module mock"
  trap — over-specification to call signatures).
- `pytest` tests asserting internal call args (`mock.assert_called_with`) rather
  than observable outcomes.
- DB tests hitting a real database without a transaction/rollback fixture, or
  sharing mutable state across tests.
- `@pytest.mark.skip` / `xfail` without a tracked reason; silently skipped
  behavior.
- Using `time.sleep`/deterministic-but-brittle ordering in async tests; prefer
  `asyncio` test fixtures and explicit waits.