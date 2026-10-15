# Port pstack to Pi and Claude Code

## Local trial scope update

The user selected a broad import rather than a small phased subset. Import the full source and all bundled skills and playbooks first; adapt and test incrementally without limiting the imported scope. See `reference/pstack-port.md` for the current implementation, compatibility ledger, and known limitations. The phases below describe verification and adaptation work, not gates that postpone importing workflows.

## Goal

Port pstack's engineering guidance and workflows from Cursor to personal Pi and Claude Code configurations. Preserve as much of the source prose, workflow structure, and quality bar as possible. Adapt execution instructions to each harness instead of treating Cursor configuration as portable.

Source revision: `837067b75aa20ab58d7b2a2f6c0531e37118c596`.

Source: https://github.com/cursor/plugins/tree/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack

This plan covers local Claude Code, not claude.ai, Cowork, or hosted Claude Code sessions.

## Decisions already made

- Use the local name `poteto-mode`.
- Port all 24 principle skills and the full set of 23 playbooks.
- Preserve useful prose. Do not summarize away triggers, examples, rationale, safeguards, or verification requirements merely to shorten files.
- Maintain separate executable definitions for Pi and Claude Code.
- Separate model and effort policy from shared engineering guidance.
- For Claude Code, map upstream Grok 4.7 xhigh code roles to Sonnet 5.5 at xhigh, and upstream Opus 5.5 xhigh judgment roles to Opus 5.5 at medium.
- Treat that substitution as the requested configuration, not a proven equivalence between models.
- Leave Pi model assignments undecided. Do not inherit the Claude mapping by accident.
- Do not use subagents during this planning and porting session while their configuration is unavailable.
- Respect project instructions, including Jujutsu rather than Git commands.

## Current state

The current implementation is a starting point, not a completed port:

- `.agents/skills/principle-*/SKILL.md` contains the 24 principle skills from the pinned source.
- `.agents/skills/poteto-mode/` contains a locally written principle index and application rules. It is not the full upstream mode.
- Seven raw playbooks were downloaded into `.agents/skills/poteto-mode/references/playbooks/`: investigation, bug fix, feature, refactoring, performance, eval, and skill authoring. They are not routed or adapted yet.
- Claude's personal `poteto-mode` and principle links currently point at the shared skills tree.
- Pi has a `/poteto-mode` prompt template and a direct `/skill:poteto-mode` entry point.
- Structural validation has run, but no model-backed workflow verification has run.
- The existing Dotbot configuration failed parsing with the system Ruby YAML parser at a pre-existing shell entry. Investigate this separately before claiming installation is reproducible. Do not run the entire installer as a shortcut; it contains unrelated shell actions.

## Architecture

### 1. Pinned upstream reference

Keep a non-discoverable copy of the relevant upstream files, with the MIT license, revision, original paths, and a manifest. Store this outside every skill discovery root so raw Cursor instructions cannot load as local skills.

This reference is the baseline for reviewing changes and updating the port. It is not an executable configuration.

### 2. Shared guidance

Keep the 24 principle skills shared where their instructions are harness-independent. Keep a common principle index, source attribution, and workflow acceptance criteria.

Principle selection retains upstream semantics:

1. Read the index.
2. Select rules by their triggers.
3. Read the selected leaf skills in full.
4. Apply them to concrete decisions.
5. Name the principle and the decision it changed in the response.

Preserve shared workflow prose where it is independent of tools, models, permissions, session mechanics, and VCS operations. Do not force a shared file when doing so leaves complicated conditional instructions for two harnesses.

### 3. Separate harness definitions

Pi and Claude Code each get their own `poteto-mode` entry, complete playbook set, execution instructions, and model policy. Each active playbook must be readable as a coherent workflow for that harness, without requiring the agent to translate Cursor instructions at runtime.

Prefer explicit, reviewable Markdown files over a template generator in the first port. Share genuinely portable files through links or references. Maintain necessary workflow variants with a change ledger that identifies their common upstream source.

Suggested layout:

```text
reference/pstack/<revision>/        # Non-discoverable upstream reference
.agents/skills/principle-*/         # Shared principle skills
.agents/skills/poteto-mode/         # Pi entry and Pi-adapted workflows
.claude/skills/poteto-mode/         # Claude entry and Claude-adapted workflows
pi/agent/prompts/poteto-mode.md     # Pi command convenience entry
plans/pstack-port.md                # This plan
```

Shared supporting skills can stay in `.agents/skills/`. Harness-specific variants belong under their respective host configuration. Confirm discovery and duplicate-name behavior before moving files or adding links.

Replace the current Claude `poteto-mode` link with a link to its Claude-specific definition. Do not replace unrelated personal skills or globally change discovery settings.

## Port inventory

### Principles

Port all 24 `principle-*` skills. Preserve their prose by default. Audit delegation and autonomy principles especially closely: a skill cannot override user restrictions, permissions, or project instructions. Record any required changes rather than silently weakening or expanding the rules.

Retain the principle index as part of each host's Poteto Mode experience. Keep its content synchronized without making the agent read the entire library for every task.

### All 23 playbooks

| Group | Playbooks | Adaptation focus |
| --- | --- | --- |
| Core engineering | Investigation, Bug fix, Feature, Refactoring, Perf issue | Investigation and design steps, role routing, task tracking, runtime proof |
| Experiments and diagnostics | Prototype, Visual parity, Hillclimb, Runtime forensics, Trace forensics, Eval | Driving real surfaces, baseline capture, artifact parsing, blinded trials, transcript access |
| Authoring and delivery | Authoring a skill, Multi-phase plan, Opening a PR, Babysit, Shipping | Native skill authoring, Jujutsu, PR tools, review gates, explicit merge authority |
| Continuity and autonomy | Autonomous run, Session pickup, Pause safely, Worktree cleanup | Session state, safe handoffs, stop conditions, cleanup safeguards |
| Program orchestration | Orchestrate, Autopilot-full, Autopilot-stack | Agent ownership, isolation, task coordination, fresh-agent rules, model availability |

Keep each workflow's trigger, ordered steps, branch conditions, ownership rules, verification criteria, and final response requirements. Do not mark a playbook functional while it depends on an unavailable skill or unimplemented host behavior.

### Supporting skills

Audit all supporting skills for inclusion. Import dependencies with the workflows that need them rather than leaving unresolved names.

Expected groups include:

- Entry and help: `poteto-help`, `in-your-own-words`.
- Understanding: `how`, `why`, `teach`, `blast-radius`.
- Design and delegation: `architect`, `arena`, `swarm`, `interrogate`, `figure-it-out`.
- Implementation and evidence: `tdd`, `typescript-best-practices`, `benchmark-checklist`, `create-verification-skill`, `maintain-verification-skill`, `show-me-your-work`.
- Prose and cleanup: `technical-writing`, `unslop`, `bro`, `no-comments`.
- Continuity and improvement: `recall`, `ketchup`, `reflect`, `correct`, `automate-me`.
- Model configuration: replace Cursor's `setup-pstack` with host-native setup guidance or configuration, not a copied `.mdc` writer.

Existing local skills such as `tdd` and `bro` must not be overwritten without review. Compare them with pstack, then explicitly choose integration, a separately named variant, or a documented local replacement.

### Agents and external dependencies

Port the intent and instructions of `poteto-agent` and `comment-sicko` with separate host definitions. Confirm that each receives the required guidance, tools, and scope; do not assume parent context is inherited.

Audit unbundled dependencies such as `deslop`, `control-cli`, `control-ui`, Cursor's `create-skill`, and `/loop`. For each, select a native replacement, implement an adapter, or mark the dependent operation unavailable. Reading a public upstream file is not equivalent to installing its required tool or integration.

Benny automations and `make-bot-ui` are separate integration work. Inventory them, but do not enable Slack, webhook, Tailscale, or bot operations as part of the core port.

## Shared versus harness-specific behavior

| Concern | Shared | Pi-specific | Claude Code-specific |
| --- | --- | --- | --- |
| Principles | Names, triggers, rationale, engineering rules | Any necessary capability caveat | Any necessary capability caveat |
| Mode | Intent, principle application, task classification | Pi skill and prompt entry | Claude skill entry |
| Playbooks | Portable prose and acceptance criteria | Complete Pi execution instructions | Complete Claude execution instructions |
| Task tracking | Ordered steps and explicit skip reasons | Available Pi todo mechanism | Available Claude task mechanism |
| Delegation | Scope, ownership, independent verification | Installed agent tools and their actual contracts | Native Agent tools and agent definitions |
| Model policy | Role names and role meaning | Separate undecided mapping | Requested Sonnet/Opus mapping |
| Session continuity | Handoff contents and evidence requirements | Pi session and compaction behavior | Claude session and compaction behavior |
| Verification | Real-artifact proof and honest limitations | Available Pi control tools | Available Claude control tools |
| Permissions | User authority and explicit safeguards | Pi permission/trust behavior | Claude permission modes and grants |
| VCS | Small, verifiable delivery units | Jujutsu-native commands | Jujutsu-native commands |

## Model policy

Extract every role assignment from the full mode, playbooks, agents, and supporting skills. Use a single policy definition per host rather than updating model names throughout workflow prose.

The role inventory must include code playbook roles, hardest tasks, judgment and prose, explorers and synthesizers, architecture panels, review panels, arena runners and judges, and swarm workers. Preserve the difference between a single role assignment and a panel list.

### Claude Code

- Code roles assigned upstream to Grok 4.7 xhigh use Sonnet 5.5 at xhigh.
- Judgment roles assigned upstream to Opus 5.5 xhigh use Opus 5.5 at medium.
- Verify the actual entitled model IDs, supported effort levels, and per-agent/per-invocation configuration in the installed Claude version before enabling these mappings.
- Do not emulate a two-family review panel by duplicating the same model and claim the original independence. Document any loss of model diversity or change to judge selection.
- Do not silently substitute a different model or effort level when the requested configuration is unavailable. Report the limitation.

### Pi

- Leave role mappings unset pending the user's choice.
- Model-independent workflows can be tested directly in the main session.
- Do not automatically delegate model-dependent roles or infer that `unset` means a configured model.
- A configured no-delegation path must be explicit. Do not claim sequential self-review is an independent review.

## Implementation phases

### Phase 1: Source audit and preservation

- Fetch the full pinned mode, 23 playbooks, supporting skills, agents, and license into a non-discoverable reference tree.
- Read the source completely and inventory dependencies and model assignments.
- Produce a compatibility ledger with original path, destination, preserved sections, changed sections, replacements, and unresolved dependencies.
- Compare the imported principles against the source and record the existing external-link adaptation.

Completion: all 23 playbooks and 24 principles are accounted for; every required dependency and role has an explicit disposition.

### Phase 2: Split the harness definitions

- Replace the prototype shared mode with explicit Pi and Claude definitions.
- Preserve the full applicable upstream mode prose, not just the principle index.
- Add the full playbook catalog and native invocation instructions.
- Add independent model policy files and document unresolved Pi assignments.
- Update only the relevant installation links. Preserve existing local configuration.

Completion: both entry points resolve to the correct host definition, without duplicate discovery or accidental cross-host model policy.

### Phase 3: Core workflows and supporting skills

Port Investigation, Bug fix, Feature, Refactoring, Perf issue, Prototype, Visual parity, Authoring a skill, Eval, and Multi-phase plan, together with their dependencies.

Keep the complete source workflow where practical. Review changes to delegation requirements, design panels, verification surfaces, PR creation, and commit sequencing explicitly.

Completion: each workflow has resolved references, native host operations, evidence requirements, and a truthful capability status.

### Phase 4: Diagnostics, delivery, and continuity

Port Hillclimb, Runtime forensics, Trace forensics, Opening a PR, Babysit, Shipping, Autonomous run, Session pickup, Pause safely, and Worktree cleanup.

Adapt VCS operations to Jujutsu. Preserve the distinction between code-ready, merge-ready, verified, and authorized to merge. Do not interpret invoking a workflow as permission for all external actions.

Completion: workflows have bounded execution, safe handoffs, scoped transcript access, and explicit gates for irreversible actions.

### Phase 5: Agents and program workflows

Port `poteto-agent`, `comment-sicko`, Orchestrate, Autopilot-full, and Autopilot-stack with their supporting delegation skills.

Preserve orchestration intent while adapting to actual host capabilities. Configure models only when available and approved. Model-backed delegation testing remains blocked until the relevant configuration is ready.

Completion: ownership, scope transfer, isolation, model selection, cancellation, and independent verification have been checked per host.

### Phase 6: Evaluation and rollout

Perform structural checks first, then live trials in each harness. Run trials sequentially unless the user authorizes delegation and the relevant model configuration is ready.

Structural checks:

- Frontmatter and configuration parse correctly.
- All local references and installation targets resolve.
- No active definition contains unresolved Cursor tool calls, `.mdc` paths, or hard-coded upstream model IDs.
- Shared prose changes have an explicit reason.
- Each discovered skill loads once per intended host.
- Every playbook has a recorded readiness status.

Behavioral trials:

- Investigation remains read-only and produces cited findings.
- Bug fix reproduces the defect and verifies the same surface after the fix.
- Feature work selects a data shape and follows a coherent design and implementation workflow.
- Refactoring pins behavior before moving structure and proves equivalence.
- Performance work preserves baseline evidence and explains the measured result.
- Named-principle steering loads the actual rule and changes a concrete decision.
- Missing tools or model roles produce an explicit limitation rather than invented success.
- User restrictions, including no-subagent instructions, remain effective.
- Mode behavior after a follow-up turn or compaction is observed and documented, not assumed to match Cursor Custom Modes.

Evaluate prompt variants with organic tasks. Do not tell trial agents which principle names they are expected to cite. Grade observed actions, file reads, and artifacts rather than self-report alone.

Completion: publish results and known limitations separately for Pi and Claude Code. Enable only validated capabilities by default.

## Review criteria

The port is successful when both hosts retain pstack's engineering rigor and useful prose while providing coherent, native workflows. Installation alone is not completion.

Do not silently discard difficult workflows, remove model-dependent steps without recording the change, duplicate policy throughout files, or claim that a shared Markdown file creates persistent mode behavior.

## Immediate next step

Use the broad local import for controlled trials. Verify skill discovery and read-only principle-guided work first. Resolve model assignments, native agent dispatch, and script compatibility before enabling model-dependent or autonomous operations. Review native workflow rewrites against the preserved upstream snapshot.
