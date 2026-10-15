# Analyze Report Format

Append exactly one dated comment per completed run. Earlier reports remain immutable; this newest report logically supersedes them.

```markdown
## Analyze Report — {BLOCKED | PASS} — {YYYY-MM-DD HH:MM UTC}

**Story:** AB#{id} — {title}
**Constitution:** GUIDELINES.md + .claude/rules/ (via CLAUDE.md) ({N} MUST/MUST-NOT rules checked | not found)
**Supersedes:** all earlier Analyze Report comments for this Story

### Findings
| ID | Severity | Category | Location | Fix |
|----|----------|----------|----------|-----|
| A1 | critical | coverage | AC #2 | Add a named test and mapped implementation task, then re-run /analyze. |

### Coverage Summary
- **Coverage:** {covered}/{total} ACs ({pct}%)
- **ACs uncovered:** {list or “none”}
- **Orphan tests/tasks:** {count} — {list or “none”}
- **Ambiguity:** {count} · **Duplication:** {count} · **Inconsistency:** {count}
- **Critical findings:** {count}

### Remediation
- {Concrete fix and owning skill.}

---
*Spec-read-only static analysis | /analyze | {timestamp}*
```

For PASS, retain the Findings heading/table with no rows and report 100% only when evidence supports it. Finding IDs use pass letters (`A1`…`H1`), and each row includes a precise AC, TDD row, section, file target, or rule location.

## Remediation routing

- A, technical E/F, G, H: revise through `/technical-plan`, then re-run `/analyze`.
- Missing or contradictory business behavior: revise through `/feature-plan`, then `/technical-plan`, then `/analyze`.
- C: use the relevant planning skill’s interactive Clarify flow; Analyze asks no questions and supplies no assumption.
- B: update the plan to comply with the cited constitution rule; never invent a rule.

Terminal summary:

```text
Analyze: AB#{id} — {title}
  Coverage: {covered}/{total} ACs ({pct}%)
  Critical: {count}  High: {count}  Medium: {count}
  Gate: {analyze:critical → BLOCKED | analyze:pass → PASS}
  Next: {concrete remediation | ready for validated downstream promotion}
```
