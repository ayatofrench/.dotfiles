# Local pstack trial

## Scope

Initially imported from Cursor plugins revision `837067b75aa20ab58d7b2a2f6c0531e37118c596`. The accepted revision and source integrity now live in `pstack.lock.json`. See [the update workflow](../pstack/README.md) to check upstream, review a staged diff, and accept changes explicitly.

- Complete upstream snapshot in `reference/pstack/`, including guides, agents, automation assets, scripts, and MIT license.
- All 24 principle skills remain shared in `.agents/skills/principle-*/`.
- All 29 other upstream skills have separate Pi and Claude Code copies.
- Both hosts have the complete `poteto-mode`, inline principle index, all 23 playbooks, and bundled supporting files.
- Supporting skills use the `pstack-` prefix to avoid overwriting existing local skills. `poteto-mode`, `poteto-help`, and `principle-*` retain their names.
- Four earlier staged agent drafts cover two agents in each host. The native Claude Comment Sicko definition is now maintained separately at `pstack/hosts/claude/agents/comment-sicko.md`, with read/search tools only and Opus medium requested. It is installed through a personal agent symlink and passed an authorized direct-definition fixture review with Opus 5.5 and read/search-only tools. Parent-to-subagent dispatch and the exact effective effort remain unverified. See the agent directory's README for evidence and limitations.

This is a broad local trial import, not a fully native rewrite or a claim that every workflow is operational.

## Use it

In Claude Code:

```text
/poteto-mode refactor this subsystem without changing its behavior
/poteto-help explain how the principles steer a refactoring
```

In Pi, reload resources with `/reload`, then use:

```text
/poteto-mode refactor this subsystem without changing its behavior
/skill:poteto-help explain how the principles steer a refactoring
```

Pi also supports `/skill:poteto-mode`. Supporting skill names are `/pstack-how` in Claude and `/skill:pstack-how` in Pi. All imported skills are explicit-only during the trial. Workflow routing reads the referenced skill files directly.

Run native model setup with `/pstack-setup-pstack` in Claude or `/skill:pstack-setup-pstack` in Pi. Setup reads the existing policy, checks model and dispatch capabilities, presents all roles and panel seats, and asks for confirmation before saving. It does not itself implement the dispatcher, install agents, or perform paid probes. Pi choices can remain unset.

The mode does not recreate Cursor's persistent Custom Mode. Do not assume it is re-injected after every turn or compaction.

## Shared and separate definitions

| Definition | Pi | Claude Code |
| --- | --- | --- |
| Principles | Shared `.agents/skills/principle-*` | Symlinks to those same files |
| Mode and playbooks | `.agents/skills/poteto-mode/` | `.claude/skills/poteto-mode/` |
| Supporting skills | `.agents/skills/pstack-*` and `poteto-help` | `.claude/skills/pstack-*` and `poteto-help` |
| Execution contract | Mode's `HARNESS.md` | Mode's `HARNESS.md` |
| Model policy | Mode's `MODELS.md`, unconfigured | Mode's `MODELS.md`, requested Sonnet/Opus mapping |
| Agents | Drafts in `reference/pstack-local-agents/pi/` | Native Comment Sicko in `pstack/hosts/claude/agents/`; earlier drafts in `reference/pstack-local-agents/claude/` |

The host contracts cover user restrictions, model policy, Jujutsu, scoped transcripts, external tools, and script execution. Claude's importer now translates harness instructions through `scripts/pstack-claude-adapter.mjs`; Pi does not use that adapter. Claude's maintained `CLAUDE-NATIVE.md` documents the native operation contracts and version limits. Imported executable scripts and external service integrations remain separate from Markdown instruction translation.

### Native Claude mapping

| Upstream operation | Local Claude mapping | Verification status |
| --- | --- | --- |
| Task delegation | Agent, native `general-purpose`, reviewed custom profiles | Instruction tests; Comment Sicko direct run only |
| AskQuestion | AskUserQuestion | Translation checked |
| Todo tracking | Exposed TaskCreate/Get/List/Update or TodoWrite | Native reference; session availability varies |
| Model rule lookup | MODELS.md plus native model/effort settings | No source-default fallback; dispatch checks remain |
| Cloud worker flags | Local Agent execution and explicit Jujutsu workspace preparation | Swarm instruction tests; no fleet test |
| Loop and wakeups | Native /loop and exposed scheduling/Monitor tools | Current docs checked; no live schedule created |
| Skill authoring | Native Claude SKILL.md procedure and .claude/skills paths | Translation checked; no assumed /create-skill command |
| Session history | Exact task-scoped native transcript paths and schema inspection | Direct trial logs inspected; broad recall untested |
| Custom Mode | Inline skill context with explicit re-read after context loss | No assertion of per-turn persistent mode equivalence |

All imported skills remain explicit-only. Scheduled prompts must tell Claude to read the resolved workflow files rather than assuming a scheduled slash command executes them. Pi's missing or extension-provided capabilities remain a separate implementation decision.

## Compatibility ledger

All playbooks are imported in full for both hosts. “Imported” does not mean live-tested.

| Playbook | Main unresolved or adapted execution concerns |
| --- | --- |
| Investigation | `how` and `why` delegation unavailable until model setup; main-session investigation permitted with skips |
| Bug fix | Runtime control tools, design delegates, Jujutsu delivery |
| Feature | Design panels, mandatory delegation, independent review; direct execution cannot claim panel evidence |
| Refactoring | Characterization/equivalence evidence, design panels, Jujutsu sequencing |
| Perf issue | Runtime profiling tools, benchmark procedure, model-dependent fix delegates |
| Hillclimb | Real metric harness, bounded iteration, per-win Jujutsu delivery |
| Runtime forensics | Platform instrumentation and live control access |
| Trace forensics | Artifact readers and platform-specific tooling |
| Prototype | Isolated attempts and model-dependent comparisons |
| Visual parity | Real UI driver and comparison tooling |
| Authoring a skill | Local `build-skill` replaces Cursor's built-in authoring skill |
| Eval | Sanitized environments, trial model choices, blinded judge, task-scoped native transcripts |
| Babysit | PR CLI/authentication, native task lifetime, explicit authority for remote writes |
| Shipping | Independent verification and explicit merge authority; green CI alone is insufficient |
| Autonomous run | Native lifecycle, bounded loops and stop conditions |
| Orchestrate | Native agent dispatch, task ownership, work isolation, model configuration |
| Autopilot-full | Native fleet management, independent verdicts, merge authorization |
| Autopilot-stack | Native fleet management, Jujutsu stack operations, independent verdicts |
| Session pickup | Task-scoped native session/transcript access |
| Pause safely | Native session state and durable handoff |
| Multi-phase plan | Native task tracking and Jujutsu delivery layout |
| Worktree cleanup | Upstream scripts require audit; Jujutsu workspace lifecycle and deletion gates |
| Opening a PR | Jujutsu rather than embedded Git commands, available PR tools, source writing standards |

### Dependencies

- Imported: all bundled understanding, design, review, verification, writing, correction, recall, and setup skills.
- Native setup: `pstack-setup-pstack` has separate maintained Pi and Claude workflows under `pstack/hosts/<host>/skills/`. Each reads and updates its host's `MODELS.md` after validation and confirmation. Neither launches delegates or treats a policy save as successful dispatch. The original Cursor setup procedure remains in the source snapshot.
- Unbundled external skills: `control-cli`, `control-ui`, and `deslop`. Select actual available app-driving or review capabilities before treating dependent steps as runnable. Claude has native /loop, agent, task, question, and skill-authoring mechanisms; their local mappings are described above. Pi adapters remain separate.
- Reference-only: Benny and `pstack-make-bot-ui`. No bot, Slack, Tailscale, cloud-agent, or webhook setup has been enabled.
- Unapproved scripts: bundled scripts and lockfiles are retained, not automatically installed or executed. Review each script before use.

### Model policy

Claude's requested code assignment is Sonnet 5.5 at xhigh; judgment and hardest tasks use Opus 5.5 at medium. Entitled IDs and native effort controls still require runtime validation. Both are Claude-family models, so the port must not claim that this preserves upstream cross-family review.

Pi assignments are unset. Do not guess a model, use Claude's mapping, or silently inherit the parent model. Main-session work can proceed with explicit delegation skips, but required independent verdicts remain blocked.

## Regenerate and check

```bash
node --test scripts/pstack-source.test.mjs scripts/pstack-claude-adapter.test.mjs
node scripts/import-pstack.mjs
node scripts/check-pstack-port.mjs
```

The importer regenerates the host copies from the pinned local source. It renames supporting skills, replaces upstream default model IDs with host policy references, applies the Claude-only Markdown adapter, adds the host-contract entry instruction, and points missing guide links at the pinned public source. It preserves host-owned `HARNESS.md` and `MODELS.md` files and applies maintained skill overrides from `pstack/hosts/<host>/skills/` after the upstream transformations. Edit native setup definitions there, then regenerate. Do not edit other generated prose without also updating the importer or recording a deliberate maintained fork.

The source snapshot is not in a skill discovery directory. Its bundled executable code has not been run.

Structural checks cover the imported skill and playbook counts, activation metadata, host contracts, policy files, licenses, and local Markdown links. They do not establish runtime correctness.

Installation links are declared in `install.conf.yaml`; new personal Claude links were also created directly without running the full installer. The pre-existing installer shell entries need a separate YAML compatibility check before the whole configuration is called reproducible.

## Next testing pass

1. Confirm resource discovery and direct invocation in each interactive harness.
2. Try read-only investigation and named-principle steering without delegation.
3. Validate Claude's entitled model IDs and effort controls; ask the user for Pi assignments.
4. Audit native agent dispatch and script replacements before installing staged agents or attempting autonomous workflows.
5. Rewrite high-use Cursor execution paragraphs into fully native instructions, preserving their reasoning and safeguards. Keep the ledger current.
