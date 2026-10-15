# Claude Code model policy

Status: requested mappings recorded; entitled IDs, effort support, and agent dispatch are not runtime-validated. Delegation is gated until that validation is complete.

| Role | Requested model | Requested effort |
| --- | --- | --- |
| feature, refactoring | Sonnet 5.5 | xhigh |
| bug-fix | Sonnet 5.5 | xhigh |
| perf-issue | Sonnet 5.5 | xhigh |
| hillclimb | Sonnet 5.5 | xhigh |
| judgment and prose | Opus 5.5 | medium |
| hardest tasks | Opus 5.5 | medium |
| how explorer | Sonnet 5.5 | xhigh |
| how explainer | Opus 5.5 | medium |
| why investigators | Sonnet 5.5 | xhigh |
| why synthesizer | Opus 5.5 | medium |
| reflect tooling | Sonnet 5.5 | xhigh |
| reflect judgment, divergent, synthesizer | Opus 5.5 | medium |
| arena runners | Opus 5.5 / Sonnet 5.5 | medium / xhigh |
| arena cross-judge pool | Opus 5.5 / Sonnet 5.5 | medium / xhigh |
| swarm workers | Sonnet 5.5 | xhigh |
| architect runners | Opus 5.5 / Sonnet 5.5 | medium / xhigh |
| interrogate reviewers | Opus 5.5 / Sonnet 5.5 | medium / xhigh |

`PSTACK_CODE_ROLE` means the Sonnet code assignment; `PSTACK_JUDGMENT_ROLE` means the Opus judgment assignment. Never pass these labels as model IDs.

Do not mechanically change the effort suffix in a model slug. Resolve models and effort separately using verified native capabilities. No silent fallback to upstream defaults or the parent model.

## Comment Sicko trial evidence

Claude Code 2.1.289 discovered the installed Comment Sicko definition in an authorized direct-definition fixture trial. With explicit CLI model and effort arguments, initialization and usage reported `claude-opus-5-5`; the available tools were exactly Read, Grep, and Glob. Medium effort was requested, but the captured output did not expose the effective effort value. The fixture stayed unchanged. This does not validate the `opus` alias, agent-level defaults, parent-to-subagent dispatch, or other role assignments. Those gates remain open. See `pstack/hosts/claude/agents/README.md` in the dotfiles repository.

The model substitution is the user's requested trial configuration, not measured equivalence. Both models are Claude-family models. A two-model panel does not meet an upstream requirement for a judge from another model family. Report that limitation rather than claiming independent cross-family evidence.
