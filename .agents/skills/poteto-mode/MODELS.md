# Pi model policy

Status: unconfigured. The user will choose Pi models separately.

Do not launch model-dependent delegates or silently use Claude's mapping. A missing role is not `inherit-parent`.

## Role groups

| Role | Assignment |
| --- | --- |
| feature, refactoring | Unset |
| bug-fix | Unset |
| perf-issue | Unset |
| hillclimb | Unset |
| judgment and prose | Unset |
| hardest tasks | Unset |
| how explorer | Unset |
| how explainer | Unset |
| why investigators | Unset |
| why synthesizer | Unset |
| reflect tooling | Unset |
| reflect judgment, divergent, synthesizer | Unset |
| arena runners | Unset panel |
| arena cross-judge pool | Unset pool |
| swarm workers | Unset |
| architect runners | Unset panel |
| interrogate reviewers | Unset panel |

`PSTACK_CODE_ROLE` and `PSTACK_JUDGMENT_ROLE` in source-derived prose refer to these policy groups. They are not runnable model names. Future configuration must validate actual provider/model IDs and effort support through the installed Pi harness and agent extension.
