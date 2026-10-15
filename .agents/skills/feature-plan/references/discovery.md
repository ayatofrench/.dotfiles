# Discovery and Intake

## Intake

Resolve the ADO organization/project from `CLAUDE.md`; ask when absent or ambiguous. A numeric argument is only an ID: fetch with relations and inspect `System.WorkItemType` before routing.

- Feature: refine or resume its persisted business specification.
- Bug: preserve defect intake and business clarification. State clearly that Bug handoff to `/technical-plan` is unsupported.
- Other type: report the actual type and stop without mutation.
- Freeform: decide whether the described need is a Feature or Bug.

Before creating anything, load `shipyard.yaml` from the checked-out repository (or through the orchestrated GitHub Contents path). Read `planning.allowed_types`; if absent, use `[Feature, Bug]`. Do not create a disallowed type. Never create an Epic or Story.

## Read code before questions

Inspect code relevant to the proposed user experience: pages, routes, roles/access configuration, data concepts, and neighboring behavior. Prefer a single scoped AMN Knowledge Platform probe when its MCP tools are registered and responsive. On useful hits, use search/symbol/related-context queries. If unavailable, errored, or unindexed, silently inspect repository files directly. KP is an optional local accelerator, never a dependency and never a user question.

Use code to:

1. Answer facts rather than asking the PM.
2. Frame informed choices in terms of what users see and do.
3. Detect contradictions between the request and current behavior.

Never leak implementation details into questions or persisted content. Translate “which endpoint/role config/table filter?” into “what should this user be allowed to do/see?”

## Business Q&A

Ask exactly one question per turn. Prefer a recommended choice plus a small number of alternatives, while permitting freeform answers. Continue until the specification is complete or the PM asks to stop and assumptions are recorded.

For a **Feature**, cover:

- Problem, affected users, current impact, and desired value.
- Personas, role-specific behavior, access, and exclusions.
- Entry point and step-by-step workflow for each persona.
- Empty, invalid, denied, timeout, and other failure outcomes.
- Data users provide or see, without discussing implementation.
- Deadline, release, compliance, dependencies, rollout constraints, and explicit out-of-scope behavior.
- Business Value on Fibonacci scale `1, 2, 3, 5, 8, 13`, with PM confirmation.

For a **Bug**, cover:

- Affected users and business impact.
- Observable behavior versus expected behavior.
- Preconditions and the shortest reproducible user workflow.
- Frequency, regression status, affected scope, and known workarounds.
- Failure evidence phrased without implementation details.
- Business-verifiable correction criteria and explicit non-goals.

Every answer that implies a pass/fail outcome should produce or refine a GIVEN/WHEN/THEN acceptance criterion. Present the criteria back to the PM before commit.
