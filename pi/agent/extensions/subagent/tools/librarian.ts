import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { AgentDefinition } from "../shared/agents.ts";
import { runSubagent } from "../shared/session.ts";

export default function registerLibrarian(pi: ExtensionAPI, agent: AgentDefinition) {
	pi.registerTool({
		name: "librarian",
		label: "Librarian",
		description:
			"Research external libraries, unfamiliar repositories, and supplied public URLs in an isolated read-only session. The call blocks and returns the Librarian's last response plus its persisted child session ID.",
		promptSnippet: "Research libraries, repositories, documentation, and supplied public URLs",
		parameters: Type.Object({
			task: Type.String({ description: "Research task" }),
			context: Type.Optional(Type.String({ description: "Additional context" })),
			repo: Type.Optional(Type.String({ description: "Repository or public URL to inspect" })),
			cwd: Type.Optional(Type.String({ description: "Working directory, absolute or relative to the parent session" })),
		}),
		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			const context = [
				params.repo?.trim() ? `Repository or URL to inspect: ${params.repo.trim()}` : undefined,
				params.context?.trim(),
			]
				.filter((part): part is string => part !== undefined && part.length > 0)
				.join("\n\n");
			return runSubagent(
				{
					agent,
					task: params.task,
					context: context || undefined,
					cwd: params.cwd,
				},
				ctx,
				signal,
				onUpdate,
			);
		},
	});
}
