import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { AgentDefinition } from "../shared/agents.ts";
import { runSubagent } from "../shared/session.ts";
import { SubagentFileReferencesSchema } from "../shared/tool-schema.ts";

export default function registerOracle(pi: ExtensionAPI, agent: AgentDefinition) {
	pi.registerTool({
		name: "oracle",
		label: "Oracle",
		description:
			"Consult an isolated reasoning agent for architecture review, debugging, deep code review, and implementation planning. The call blocks and returns the Oracle's last response plus its persisted child session ID.",
		promptSnippet: "Consult an isolated reasoning agent for architecture, debugging, review, or planning",
		parameters: Type.Object({
			task: Type.String({ description: "Task or question for the Oracle" }),
			context: Type.Optional(
				Type.String({
					description:
						"Concise inline context. Task and context together are limited to 64 KiB UTF-8; use lazy file references for large content.",
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
