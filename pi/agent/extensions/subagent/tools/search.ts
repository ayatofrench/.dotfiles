import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { AgentDefinition } from "../shared/agents.ts";
import { runSubagent } from "../shared/session.ts";

export default function registerSearch(pi: ExtensionAPI, agent: AgentDefinition) {
	pi.registerTool({
		name: "search",
		label: "Search",
		description:
			"Run focused codebase reconnaissance in an isolated, read-only session. The call blocks and returns the last summary plus its persisted child session ID.",
		promptSnippet: "Run isolated, read-only codebase reconnaissance",
		parameters: Type.Object({
			query: Type.String({ description: "What to find in the codebase" }),
			path: Type.Optional(Type.String({ description: "Subdirectory to focus the search under" })),
			cwd: Type.Optional(Type.String({ description: "Working directory, absolute or relative to the parent session" })),
		}),
		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			const focus = params.path?.trim()
				? `Focus the search under: ${params.path.trim()}`
				: undefined;
			return runSubagent(
				{
					agent,
					task: params.query,
					context: focus,
					cwd: params.cwd,
				},
				ctx,
				signal,
				onUpdate,
			);
		},
	});
}
