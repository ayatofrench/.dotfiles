// Translate instruction text only. Bundled executable scripts remain unaudited.
export function adaptClaudeMarkdown(text, skill, relativePath) {
  if (skill === 'make-bot-ui') return text; // External service integration, not a harness primitive.

  text = text.replace(/\bTask\b/g, 'Agent')
    .replaceAll('generalPurpose', 'general-purpose')
    .replaceAll('AskQuestion', 'AskUserQuestion')
    .replaceAll("Cursor's `/loop` command", "Claude Code's `/loop` command")
    .replaceAll("Cursor's `/loop`", "Claude Code's `/loop`")
    .replaceAll('Cursor environment', 'Claude Code environment')
    .replaceAll('Cursor cloud agent', 'Claude Code local agent')
    .replaceAll('.cursor/skills/', '.claude/skills/')
    .replaceAll('~/.cursor/plugins/', '~/.claude/plugins/')
    .replaceAll('a Cursor restart', 'a Claude session restart')
    .replaceAll("Cursor's Plan Mode", "Claude Code's Plan Mode")
    .replaceAll("Cursor's built-in babysit skill", 'another babysitting workflow')
    .replaceAll("Cursor's own skill", 'another installed skill');

  // Model fallback is policy, not a tool-name substitution. Replace complete
  // execution paragraphs so the source's silent fallback cannot survive.
  text = text.split('\n').map(line => {
    if (!line.includes('pstack-models.mdc')) return line;
    const prefix = line.match(/^\d+\. /)?.[0] ?? '';
    const roles = [...line.matchAll(/`([^`]+)`/g)]
      .map(match => match[1])
      .filter(value => /^(feature, refactoring|bug-fix|perf-issue|hillclimb|judgment and prose|hardest tasks|how explorer|how explainer|why investigators|why synthesizer|reflect tooling|reflect judgment, divergent, synthesizer|arena runners|arena cross-judge pool|swarm workers|architect runners|interrogate reviewers)$/.test(value));
    const restriction = skill === 'how' ? ' Explorers and explainers require read-only native tool profiles.' : '';
    const judge = roles.includes('arena cross-judge pool') ? ' After candidate completion, select one eligible read-only judge from the pool, preferring a different model family when available; disclose an unavailable diversity requirement.' : '';
    return `${prefix}Resolve ${roles.length ? [...new Set(roles)].map(role => `\`${role}\``).join(', ') : 'the roles named by this workflow'} through the host MODELS.md policy and CLAUDE-NATIVE.md execution reference. Dispatch through the native Agent tool. Preserve panel seat counts and the single cross-judge selection. Select a native agent profile that applies both the configured model and effort. Missing assignments, unsupported effort, or unavailable profiles are blocked; never silently use a source default, another family, or the parent model.${restriction}${judge}`;
  }).join('\n');

  text = text.replace(/\*\*Defaults for every `Agent` call\.\*\*[^\n]*/,
    '**Defaults for every `Agent` call.** Follow CLAUDE-NATIVE.md and the host MODELS.md policy. Code delegates use the configured code role; prose and judgment use the judgment role; the hardest changes use the hardest-tasks role. Prefer background execution when supported. Pass scoped file pointers, the complete brief, and resolved guidance paths. Model and effort are separate native settings, never a combined slug. On Claude versions without per-invocation effort, use a reviewed role-specific agent definition. Missing assignments or profiles block dispatch; no implicit fallback. A readonly reviewer needs an actual restricted tool profile, not a Cursor boolean. Keep the coordinator in the parent conversation.');
  text = text.replace(/^Each reviewer gets[^\n]*/gm,
    'Each reviewer uses the configured native read-only profile for its seat, with both model and effort applied. Preserve the configured list and explicit inheritance only when the host policy permits it. Do not substitute table defaults for an absent role.');
  text = text.replace(/^If the Agent tool rejects[^\n]*/gm,
    'If Claude rejects a requested model or profile, report the blocked role and ask for a supported choice. Do not silently substitute another model or effort.');
  text = text.replace(/^Every spawn is a Agent subagent[^\n]*/gm,
    'Use the native Agent tool with a read-only profile for explorers and explainers. Resolve the how-explorer and how-explainer roles from the host policy. Apply the configured model and effort through native agent settings; do not send a readonly parameter.');
  text = text.replace(/^Every spawn is `general-purpose`[^\n]*/gm,
    'Use native Agent calls with the tools required for the evidence source. MCP availability is controlled by native tool access, not a readonly/Ask boolean. Investigators are read-only; allow only the required read operations. Do not grant write-capable tools merely to obtain MCP access.');

  text = text.replaceAll('`readonly: true`', 'a read-only native agent tool profile')
    .replaceAll('`readonly: false`', 'an explicitly scoped native tool profile')
    .replaceAll('agent mode (readonly strips MCP)', 'a native tool profile with the required MCP access')
    .replaceAll('and readonly strips MCPs', 'with MCP access governed by native tool permissions')
    .replaceAll('because readonly strips MCPs', 'with MCP access governed by native tool permissions');

  if (skill === 'swarm' && relativePath === 'SKILL.md') {
    text = text.replace('Fan out N parallel cloud workers.', 'Fan out N parallel native Claude Code agents.')
      .replace(/^Spawn all N workers[^\n]*/m,
        'Spawn N workers with the native Agent tool, one brief per worker, using reviewed role-specific profiles and background execution when supported. This is local execution; do not send environment or cloud-base parameters. Assign separate Jujutsu workspaces before writable concurrent tasks and pass each workspace path explicitly.')
      .replace(/^When a worker must start[^\n]*/m,
        'When a worker needs a different base revision, prepare and verify its Jujutsu workspace at that revision before dispatch. Do not assume a native Git-worktree option supports Jujutsu.');
  }

  text = text.replaceAll("Cursor's built-in `create-skill` skill", 'the native skill-authoring procedure in CLAUDE-NATIVE.md')
    .replaceAll("Cursor's built-in `create-skill`", 'the native skill-authoring procedure in CLAUDE-NATIVE.md')
    .replaceAll("Cursor's built-in for authoring SKILL.md files", 'the native skill-authoring procedure described in CLAUDE-NATIVE.md');

  // These are task-scoped transcript instructions, not a guessed conversion
  // of Cursor's workspace slug algorithm to Claude's session format.
  if (skill === 'recall') {
    text = text.replace(/^Transcripts live at[^\n]*/m,
      'Use only Claude session transcripts explicitly identified for this task. The active skill can receive CLAUDE_SESSION_ID, but an ID alone is not a transcript path. Resolve approved session IDs within the exact current project directory under ~/.claude/projects/, or ask for paths. Stream-JSON and persisted-session schemas differ: inspect one scoped record before parsing. Do not copy the upstream Cursor slug or message-schema assumptions.');
  }
  text = text.replace(/`~\/\.cursor\/projects\/\*\/`/g, '`~/.claude/projects/*/`')
    .replace(/`agent-transcripts\/`/g, 'the explicitly identified Claude session transcript location');

  if (skill === 'why') {
    text = text.replace('list the available MCPs from the Claude Code environment. Use the available-tools map when present. Otherwise inspect the `mcps/` directory Cursor exposes for enabled MCP servers.',
      'inspect the native available-tools list and MCP ToolSearch capabilities. Search for the required evidence tools. Do not assume a filesystem mcps directory or enable an unconfigured server.');
  }
  if (skill === 'poteto-help') {
    text = text.replace(/## Get set up\n[\s\S]*?(?=## Start a task)/,
      '## Get set up\n\nThe local skills are installed through dotfiles. Invoke `/pstack-setup-pstack` to review the Claude model policy and `/poteto-mode` for a task. Do not run a Cursor plugin installer. Setup confirmation does not install agent profiles or validate runtime dispatch. Extra cost comes from agent fan-out and review panels; configure seat counts and per-role effort explicitly. Offer project verification setup once when no real-app harness exists.\n\n');
    text = text.replace(/Whether `\/poteto-mode` stays on[\s\S]*?(?=## Pick a skill)/,
      'Invoke `/poteto-mode` as an inline Claude skill. Its content participates in conversation context; it is not a Cursor Custom Mode with guaranteed per-turn re-injection. For a new task or after context loss, read the mode and selected workflow again. Use native Agent definitions for delegates; the parent owns the playbook.\n\n');
    text = text.replace('- `/loop` and `/create-skill` are Cursor built-ins.',
      '- `/loop` is a native Claude scheduling skill. Skill authoring uses Claude SKILL.md files and the procedure in CLAUDE-NATIVE.md, not an assumed `/create-skill` command.');
    text = text.replace(/\| The mode stopped applying[^\n]*/,
      '| The mode stopped applying after a few turns | Re-invoke `/poteto-mode` and read the current workflow. Claude skill context is not Cursor Custom Mode persistence. |');
  }
  text = text.replaceAll('PSTACK_CODE_ROLE', 'configured code role')
    .replaceAll('PSTACK_JUDGMENT_ROLE', 'configured judgment role')
    .replace(/\(default `configured (code|judgment) role`\)/g, '(resolve the configured role from MODELS.md)')
    .replace(/default `configured (code|judgment) role`/g, 'resolved from the configured host policy')
    .replaceAll('**create-skill** skill', '**native skill-authoring** procedure')
    .replaceAll('`create-skill`', 'the native skill-authoring procedure')
    .replaceAll('create-skill-style', 'skill-authoring');

  if (relativePath === 'playbooks/orchestrate.md') {
    text = text.replace(/^- \*\*Worker \/ verifier\.\*\*[^\n]*/m,
      '- **Worker / verifier.** Use native local Agent calls with scoped role profiles. Each writer needs a separate verified Jujutsu workspace. Give verifiers the exact revisions and method. Use available local app-driving tools for runtime proof. Do not send cloud environment flags or assume remote machines, cloud persistence, or cross-family models that the policy does not provide.')
      .replace("the cloud agent's status in the Cursor dashboard", 'the native task or Agent status actually exposed by Claude')
      .replace(/^- After a Cursor restart:[^\n]*/m,
        '- After a session restart: read standing orders and the task ledger, inspect the actual branch and PR state, and determine which native tasks or processes still exist. Do not assume local agents survived or remote work exists. Resume only supported live tasks; otherwise create a fresh scoped agent after verifying its workspace. Audit bundled orchestration scripts before use.');
  }
  return text;
}
