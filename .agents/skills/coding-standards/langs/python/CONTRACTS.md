# Python Contracts

> **Python mechanism file.** Loaded by `coding-standards` when the change
> touches Python. Pair with the agnostic principles in `../../topics/` and
> `../../VOCABULARY.md`.

Python types are *optional* and erased at runtime, so the contract discipline is
mostly about not lying with annotations and not smuggling unproven values past a
boundary. These are the closest analogues to the TypeScript contract rules —
apply the same intent (proof preserved, escape hatches local and justified),
through Python idioms.

> Convention in catalyst is uneven across `greenlight-api` / `amanda` /
> `amncomm`: some packages use pydantic + mypy strictly, others are loose.
> **Audit the touched package first** and match or tighten it; improve the
> changed path rather than importing a looser convention into stricter code.

## Non-negotiables

- Do not use `# type: ignore` to erase an unproven obligation without a
  `# type: ignore[code]  # SAFETY: <why>` justification; treat it like TS `any`.
- Do not annotate boundary input as a domain type and trust it (`x: User` on a
  parsed-from-JSON argument is the Python `as Type`). Parse/revalidate at the
  boundary; keep the validated object inward.
- Catch values and `except Exception` broads are treated as `unknown` until
  classified — narrow to the expected types before branching on them.
- Public/mutable defaults: never put a mutable default arg (`def f(x=[])`); it
  shares state across calls. Default to `None` and construct inside.
- Exported dataclass / pydantic models are the public contract: prefer frozen /
  immutable shapes (`frozen=True` dataclass, pydantic `model_config =
  ConfigDict(frozen=True)`) unless caller mutation is part of the contract.
- mypy/pyright/strict contracts that already exist in the package are preserved;
  do not weaken them to admit changed code.

## Strong defaults

- **Protocol** (`typing.Protocol`) for seams/interfaces — structural typing, the
  direct analogue of a TS interface. Prefer a small Protocol over a runtime
  ABC when callers substitute by shape.
- **ABC** (`abc.ABC` + `abstractmethod`) only when you need runtime enforcement
  or a shared base; Protocols are lighter and usually enough for test seams.
- `@dataclass(frozen=True, slots=True)` for plain domain value objects; pydantic
  `BaseModel` for boundary/DTO models that need validation + parsing.
- `typing.Final` for module-level constants and "you must not reassign" names;
  `Literal` for finite variant strings (the Python analogue of string-literal
  unions — prefer over loose `str`).
- `enum.Enum` only for values that carry identity beyond their string; do **not**
  use numeric enums for domain states where a `Literal` / variant type reads
  better.
- Precise return annotations; `-> None` for side-effecting fns; `-> Self` for
  fluent builders; `-> AsyncIterator[T]` for async generators.
- Use `from __future__ import annotations` for forward refs; avoid string-annotation
  hacks (`"ClassName"`) beyond what the future import solves.
- `Protocol`, `TypedDict`, `Literal`, `Final` over `Any` / `dict[str, Any]`
  bags leaking into domain logic.

## Escape hatches (Python analogues)

Avoid:

```python
def find_user(id: str) -> User:
    return _rows[id]                  # index access assumed present — unproven
def call(fn): ...                    # untyped callable
data: User = request.json()          # as Type — parse it
```

Permitted narrow casts live where the invariant is established:

```python
# SAFETY: parse_user_id established the UserId invariant; callers cannot
# construct a UserId except through parse_user_id.
return cast("UserId", value)
```

`# type: ignore` is rare, targeted, and carries a code + safety reason:

```python
return value  # type: ignore[return-value]  # SAFETY: validated as UserId above
```

## Specifics you'll see in catalyst

- pydantic v2 models for API request/response shapes (`BaseModel`,
  `model_validate`, `model_dump`); prefer `model_validate` (parses+validates)
  over `__init__`/`**kwargs` (trusts input).
- `typing.Protocol` for client seams (e.g. the `EVerifyClient` /
  `DrugScreenClient` pattern) — abstract the vendor behind a Protocol so tests
  swap a fake, mirroring the TS External Adapter Module idea.
- SQLAlchemy models are persistence rows, **not** domain types — decode rows to
  domain dataclasses/pydantic before domain logic, like a boundary parse.