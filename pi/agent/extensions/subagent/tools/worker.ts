import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { AgentDefinition } from "../shared/agents.ts";
import { runSubagent } from "../shared/session.ts";
import { SubagentFileReferencesSchema } from "../shared/tool-schema.ts";

export default function registerWorker(pi: ExtensionAPI, agent: AgentDefinition) {
	pi.registerTool({
		name: "worker",
		label: "Worker",
		description:
			"Delegate a focused implementation and verification task to an isolated coding agent. The call blocks and returns the Worker's last response plus its persisted child session ID.",
		promptSnippet: "Delegate focused implementation and verification work to an isolated coding agent",
		parameters: Type.Object({
			task: Type.String({ description: "Implementation task" }),
			context: Type.Optional(
				Type.String({
					description:
						"Concise acceptance criteria or context. Task and context together are limited to 64 KiB UTF-8; use lazy file references for large content.",
				}),
			),
			files: SubagentFileReferencesSchema,
			cwd: Type.Optional(Type.String({ description: "Working directory, absolute or relative to the parent session" })),
		}),
		async execute(_toolCallId, params, signal, onUpdate, ctx) {
			return runSubagent(
				{
					agent,
					task: params.task,
					context: params.context,
					files: params.files,
					cwd: params.cwd,
				},
				ctx,
				signal,
				onUpdate,
			);
		},
	});
}
