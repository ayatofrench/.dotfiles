# Note Categories & Classification

Taxonomy for organizing work notes in `~/vaults/work/`.

## Category Directory Structure

```
~/vaults/work/
├── decisions/        # Architecture & design decisions
├── patterns/         # Reusable patterns, standards, conventions
├── bugs/             # Bug findings, root causes, debugging notes
├── learnings/        # TILs, gotchas, things discovered
├── todos/            # Follow-up items, future work
├── research/         # Investigation findings, comparisons, analysis
├── reviews/          # Code review observations, feedback themes
├── incidents/        # Incident notes, postmortems, outage context
├── rfcs/             # Design proposals, RFCs, specs
└── misc/             # Anything that doesn't fit above
```

## Classification Rules

Match the note to the FIRST category that fits:

| Category | Signal Words / Patterns | Examples |
|----------|------------------------|----------|
| **decisions** | "we decided", "chose X over Y", "going with", "tradeoff", "rationale" | Architecture choices, tech stack decisions, approach selections |
| **patterns** | "standard", "convention", "always do X", "template", "best practice", "follow this" | Coding patterns, retry strategies, error handling standards |
| **bugs** | "bug", "root cause", "found that", "broken because", "regression", "fix for" | Bug analyses, debugging sessions, root cause findings |
| **learnings** | "TIL", "discovered", "turns out", "gotcha", "didn't know", "watch out" | Surprising behaviors, undocumented features, platform quirks |
| **todos** | "TODO", "follow up", "next step", "should later", "need to", "don't forget" | Deferred work, tech debt notes, future improvements |
| **research** | "compared", "investigated", "benchmark", "options are", "pros/cons", "evaluated" | Tool comparisons, performance benchmarks, feasibility studies |
| **reviews** | "review feedback", "code quality", "refactor suggestion", "noticed that" | Recurring review themes, quality observations |
| **incidents** | "outage", "incident", "postmortem", "downtime", "alert fired", "on-call" | Incident context, resolution steps, prevention notes |
| **rfcs** | "proposal", "RFC", "design doc", "spec", "we should consider" | Design proposals, feature specifications |
| **misc** | Nothing above matches | Everything else |

## Tag Taxonomy

Tags provide cross-cutting classification. Apply 2–5 tags per note.

### Mandatory Tags

Every note MUST have:
- The **category** name as a tag (e.g., `decisions`)
- A **PR source** tag: `pr/<repo>/<number>` (e.g., `pr/catalyst/423`)

### Domain Tags (pick relevant ones)

| Tag | When to use |
|-----|-------------|
| `architecture` | System design, service boundaries, data flow |
| `authentication` | Auth, SSO, OneLogin, tokens, sessions |
| `credentialing` | Compliance, licenses, certifications, Greenlight |
| `communications` | Amanda, messaging, SMS, email, chat |
| `ai` | AI features, prompts, LLM, orchestration |
| `infrastructure` | Docker, CI/CD, deployments, cloud |
| `database` | SQL, MongoDB, migrations, queries, models |
| `api` | Endpoints, contracts, REST, GraphQL |
| `frontend` | React, UI, components, Mantine, Greenlight UI |
| `performance` | Speed, optimization, caching, N+1 |
| `security` | Vulnerabilities, auth bypass, data exposure |
| `testing` | Tests, coverage, fixtures, mocking |
| `dx` | Developer experience, tooling, local dev |

### Freeform Tags

Add 1–2 specific tags for the note's subject matter. Use lowercase kebab-case:
- `event-sourcing`, `retry-logic`, `celery-tasks`, `sqlalchemy`, `twilio`, etc.

## Filename Convention

1. Derive from the title: lowercase, kebab-case
2. Max 60 characters (truncate at word boundary)
3. Strip special characters: keep `a-z`, `0-9`, `-`
4. Examples:
   - "Event Sourcing for Audit Trail" → `event-sourcing-for-audit-trail.md`
   - "Exponential Backoff Retry Standard" → `exponential-backoff-retry-standard.md`
   - "Bug: OneLogin SAML assertion clock skew" → `onelogin-saml-assertion-clock-skew.md`

## Deduplication

Before writing a new note, check if a file with the same or very similar name already exists in the target category:

```bash
ls ~/vaults/work/<category>/
```

- If an exact filename match exists: append `-2`, `-3`, etc.
- If a similar topic exists: mention it in the summary so the user can merge manually
