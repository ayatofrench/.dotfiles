---
name: poteto-help
description: Guides users through pstack setup, /poteto-mode, and picking the skill, playbook, or principle for a task. Type /poteto-help with a question.
disable-model-invocation: true
---

Read [the claude execution contract](../poteto-mode/HARNESS.md) before following this skill. It replaces incompatible upstream execution instructions below.

# Poteto help

Answer the user's question about pstack, hand them a prompt they can send, and link the file the answer came from. For a help question, don't start the work. The user asked how, and a pstack run spends real tokens, so let them send the prompt.

A message that asks for work, such as "use pstack to fix this bug", is not a help question. Read [`poteto-mode`](../poteto-mode/SKILL.md), do the work under it, and mention once that a Custom Mode keeps it on.

This file maps questions to the skills and guide pages that hold the answers. Those files own the details. Read the file you route to before you quote it, and trust it when it disagrees with this map. The links here point into the installed plugin, which the user may not be able to open, so give the user the file's public copy: `https://github.com/cursor/plugins/blob/main/pstack/` followed by its path.

## Find out what they need

Infer the need from the message and the conversation. A named situation, such as "which skill reviews a PR?", goes straight to its section. If the need is still unclear, ask one multiple-choice question with these options, then answer only the section they pick:

- Get set up
- Start a task with `/poteto-mode`
- Pick a skill for a situation
- Fix a run that went wrong
- Make pstack my own

Check the state that changes the answer, and mention it only when it does:

Resolve the roles named by this workflow through the host MODELS.md policy and CLAUDE-NATIVE.md execution reference. Dispatch through the native Agent tool. Preserve panel seat counts and the single cross-judge selection. Select a native agent profile that applies both the configured model and effort. Missing assignments, unsupported effort, or unavailable profiles are blocked; never silently use a source default, another family, or the parent model.
- No `verify-*` skill or other app harness in the project means agents have no scripted way to drive the app. Mention `/pstack-create-verification-skill` when the question is about proving a change works.

When the model rule is missing and it matters, ask whether the user wants to pick a model for each role and a reasoning budget now. It matters when the user is new, the question is about setup or cost, or the answer depends on which models run. Ask at most once per chat. If the need is also unclear, ask both questions together. Offer two choices:

- Now: give them `/pstack-setup-pstack` to type, and answer their question too.
- Later: answer their question, and add one line saying every role keeps its default model until they run `/pstack-setup-pstack`.

## Get set up

The local skills are installed through dotfiles. Invoke `/pstack-setup-pstack` to review the Claude model policy and `/poteto-mode` for a task. Do not run a Cursor plugin installer. Setup confirmation does not install agent profiles or validate runtime dispatch. Extra cost comes from agent fan-out and review panels; configure seat counts and per-role effort explicitly. Offer project verification setup once when no real-app harness exists.

## Start a task with `/poteto-mode`

`/poteto-mode` matches the task to a playbook, copies the playbook's steps into the todo list, and runs the other skills as the steps need them. A step it skips stays in the list as `skip: <reason>`. A good prompt states the goal and how to tell it's done. It doesn't list skills, because a hand-written sequence tends to drop or reorder steps the playbook would keep. Read [`references/prompting.md`](references/prompting.md) before you help word one. [Guide page 2](https://github.com/cursor/plugins/blob/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack/docs/guide/02-poteto-mode.md) has examples.

Invoke `/poteto-mode` as an inline Claude skill. Its content participates in conversation context; it is not a Cursor Custom Mode with guaranteed per-turn re-injection. For a new task or after context loss, read the mode and selected workflow again. Use native Agent definitions for delegates; the parent owns the playbook.

## Pick a skill

The default answer is `/poteto-mode`, which runs most of the others when its steps need them. Name a skill directly when the user wants more or less of something than the playbook gives. Read the skill before you recommend it, and give one example prompt.

| The user wants to | Skill |
|---|---|
| Do any non-trivial task with rigor | [`/poteto-mode`](../poteto-mode/SKILL.md) |
| Check that the agent understood their goal and the problem before it starts | [`/pstack-in-your-own-words`](../pstack-in-your-own-words/SKILL.md) |
| Know how code works now, or where new code should live | [`/pstack-how`](../pstack-how/SKILL.md) |
| Know why code is shaped this way, or where a number came from | [`/pstack-why`](../pstack-why/SKILL.md) |
| Understand a change or subsystem, explained plainly | [`/pstack-teach`](../pstack-teach/SKILL.md) |
| Catch up on their own recent work on a topic | [`/pstack-recall`](../pstack-recall/SKILL.md) |
| Catch up on what changed in this chat since their last message, in a few plain sentences and small visuals, with enough context to decide each action item | [`/pstack-ketchup`](../pstack-ketchup/SKILL.md) |
| Know what a small diff could break outside itself | [`/pstack-blast-radius`](../pstack-blast-radius/SKILL.md) |
| Settle types and module shape before code that crosses a function boundary | [`/pstack-architect`](../pstack-architect/SKILL.md) |
| Get several attempts at one brief, merged into the best one | [`/pstack-arena`](../pstack-arena/SKILL.md) |
| Run parallel checks over slices, or race workers, as cloud agents | [`/pstack-swarm`](../pstack-swarm/SKILL.md) |
| Have different models review a diff and try to break it | [`/pstack-interrogate`](../pstack-interrogate/SKILL.md) |
| Fix a bug test-first when a cheap local test exists | [`/pstack-tdd`](../pstack-tdd/SKILL.md) |
| Apply TypeScript rules to `.ts` or `.tsx` work | [`/pstack-typescript-best-practices`](../pstack-typescript-best-practices/SKILL.md) |
| Strip comments before review, using a reviewer that didn't write them | [`/pstack-no-comments`](../pstack-no-comments/SKILL.md) |
| Clean AI tells out of prose | [`/pstack-unslop`](../pstack-unslop/SKILL.md) |
| Write docs, an RFC, a README, a PR description, or a commit message to a standard | [`/pstack-technical-writing`](../pstack-technical-writing/SKILL.md) |
| Hear the last reply again in plain words | [`/pstack-bro`](../pstack-bro/SKILL.md) |
| Give agents a scripted way to drive the app and prove behavior | [`/pstack-create-verification-skill`](../pstack-create-verification-skill/SKILL.md) |
| Bring a verification skill and its feature map back in line with the app | [`/pstack-maintain-verification-skill`](../pstack-maintain-verification-skill/SKILL.md) |
| Vet a performance number before reporting or acting on it | [`/pstack-benchmark-checklist`](../pstack-benchmark-checklist/SKILL.md) |
| Run a large or cross-cutting change, or one to review after stepping away | [`/pstack-figure-it-out`](../pstack-figure-it-out/SKILL.md) |
| Keep a decision log during a run, and review it afterward | [`/pstack-show-me-your-work`](../pstack-show-me-your-work/SKILL.md) |
| Pick a model for each role and a reasoning budget | [`/pstack-setup-pstack`](../pstack-setup-pstack/SKILL.md) |
| Turn their own working habits into a personal mode skill | [`/pstack-automate-me`](../pstack-automate-me/SKILL.md) |
| Turn what a finished task taught into skill edits | [`/pstack-reflect`](../pstack-reflect/SKILL.md) |
| Stop agents from repeating the same mistakes in this repo | [`/pstack-correct`](../pstack-correct/SKILL.md) |
| Build a page whose buttons wake a Grok Bot over a webhook | [`/pstack-make-bot-ui`](../pstack-make-bot-ui/SKILL.md) |
| Find their way around pstack | `/poteto-help` |

If a skill directory next to this one is missing from the table, read its frontmatter and route by its description. The `principle-*` directories are covered under principles below.

Close calls:

- `/pstack-how` explains what the code does. `/pstack-why` explains the reasons. `/pstack-teach` runs one or both and explains the result plainly.
- `/pstack-arena` gives every worker the same brief and merges the best parts. `/pstack-swarm` splits work into slices or a race and returns one report.
- `/pstack-architect` implements right after it settles the design. Add "with checkpoint" to review the design before it writes code.
- `/pstack-interrogate` reviews the diff. `/pstack-blast-radius` looks for breakage outside the diff and proves the one fact that makes the change safe.
- `/pstack-recall` rebuilds context across recent chats. `/pstack-ketchup` covers only this chat since the user's last message. Resuming one specific chat or branch is the Session pickup playbook.
- `/pstack-figure-it-out` designs one rigorous run. The Orchestrate playbook runs a program that spans days and many PRs. The Autonomous run playbook drives one task to a finish condition.

Not in pstack:

- `/deslop`, `control-cli`, and `control-ui` ship in the `cursor-team-kit` plugin.
- `/loop` is a native Claude scheduling skill. Skill authoring uses Claude SKILL.md files and the procedure in CLAUDE-NATIVE.md, not an assumed `/create-skill` command.
- pstack has no `/orchestrate` skill. Orchestrate is a `/poteto-mode` playbook. If the slash menu shows `/orchestrate`, another plugin provides it.

## Playbooks and principles

Playbooks are step lists inside `/poteto-mode`, not skills, so they have no slash command. Inside `/poteto-mode`, describing the task picks one, and these phrases name one directly:

- "babysit this pr" or "check on pr 123" runs Babysit. It drives the PR to merge-ready and stops there. It doesn't merge unless the user asks to merge, land, or ship.
- "land the stack" runs Shipping.
- "take over this branch" runs Session pickup.
- "pause safely" runs Pause safely.
- "full autopilot on this queue" runs Autopilot-full. "stack them, don't ship" runs Autopilot-stack.
- "run the eval playbook" runs Eval.

Without `/poteto-mode`, a phrase such as "babysit this pr" can start another installed skill for the same job instead. The Playbooks section of [`poteto-mode`](../poteto-mode/SKILL.md) lists every playbook and when it applies. [Guide page 6](https://github.com/cursor/plugins/blob/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack/docs/guide/06-verify-and-ship.md) covers opening, babysitting, and landing a PR.

pstack has no planning skill. Claude Code's Plan Mode works alongside it. For work that spans phases or stacked PRs, asking `/poteto-mode` for a plan runs the [Multi-phase plan playbook](../poteto-mode/playbooks/multi-phase-plan.md), which writes the plan and doesn't implement it. For a design question, the Prototype playbook or `/pstack-architect` settles it in code first.

Principles are one-rule skills that `/poteto-mode` reads and cites in its replies. The user rarely invokes one. They steer with the names instead, as in "apply prove it works. show me the real output." Typing `/principle-<name>` still loads one on demand. [Guide page 8](https://github.com/cursor/plugins/blob/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack/docs/guide/08-principles.md) lists them.

## Fix a run that went wrong

| Symptom | Fix |
|---|---|
| The mode stopped applying after a few turns | Re-invoke `/poteto-mode` and read the current workflow. Claude skill context is not Cursor Custom Mode persistence. |
| A question got treated as the next step of the last task | Say "new task", or say the turn doesn't need the mode. |
| A new model choice had no effect | The rule from `/pstack-setup-pstack` applies to new chats. Start one. |
| Runs cost more than expected | See the cost paragraph under Get set up. |
| A skill didn't load on its own | Only `/pstack-setup-pstack` loads from the user's words. The others load when the user types them or when `/poteto-mode` runs them, and it doesn't run every skill. |
| Parallel agents overwrote each other | Give each agent its own worktree, or run them as cloud agents, which each get their own machine. |
| An overnight run moved but finished nothing | `/loop` needs a check that can pass or fail, not a duration. See [guide page 7](https://github.com/cursor/plugins/blob/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack/docs/guide/07-overnight.md). |
| The reply claims success from a green build | Ask for the real command, flow, stored value, or profile. That's the prove-it-works principle. |

For a run that drifts, [`references/prompting.md`](references/prompting.md) has one-line steers. [Guide page 10](https://github.com/cursor/plugins/blob/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack/docs/guide/10-recipes-and-pitfalls.md) has more pitfalls and the recipes worth copying.

## Make pstack my own

- [`/pstack-automate-me`](../pstack-automate-me/SKILL.md) drafts a personal mode skill from the user's own history, to use alongside `/poteto-mode`.
- [`/pstack-reflect`](../pstack-reflect/SKILL.md) after a session turns its lessons into skill edits the user approves.
- `/poteto-mode write a skill for <workflow>` runs the authoring playbook. The eval playbook tests a skill change blind.
- Fix a misbehaving skill in its own PR, not inside the feature work where it went wrong.

[Guide page 9](https://github.com/cursor/plugins/blob/837067b75aa20ab58d7b2a2f6c0531e37118c596/pstack/docs/guide/09-make-it-yours.md) covers each of these.

## Reply

Lead with the answer. Give at most one example prompt in a code block, adapted from [`references/recipes.md`](references/recipes.md) when one fits, then the link to that file. Keep it short unless the user asked for the whole map.
