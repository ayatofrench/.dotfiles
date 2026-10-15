import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { AgentDefinition } from "../shared/agents.ts";
import { runSubagent } from "../shared/session.ts";
import { SubagentFileReferencesSchema } from "../shared/tool-schema.ts";

/** Register the code-only reviewer; plan and architecture critique belongs to oracle. */
export default function registerReviewer(pi: ExtensionAPI, agent: AgentDefinition) {
	pi.registerTool({
		name: "reviewer",
		label: "Reviewer",
		description:
			"Review implemented code or concrete diffs for evidence-backed correctness, security, and reliability issues in an isolated read-only session. Do NOT call for plans, proposals, task breakdowns, or architecture/design review; use oracle instead. Supply readable patch/source references: this agent cannot run diff commands or fetch PR URLs. Plans may accompany code only as acceptance context, never as the review target. The call blocks and returns the last review message plus its persisted child session ID.",
		promptSnippet: "Review implemented code and concrete diffs only; NOT plans or architecture (use oracle)",
		promptGuidelines: [
			"Use reviewer only for implemented code or concrete diffs with readable source/patch references. Never use reviewer to critique plans, proposals, or architecture; use oracle for those. A plan stored in a file or diff is still not a code-review target.",
		],
		parameters: Type.Object({
			task: Type.String({
				description: "Implemented-code review scope and focus; identify the concrete change or existing code to inspect. Not a plan or design review.",
			}),
			context: Type.Optional(
				Type.String({
					description:
						"Concise implementation context, diff scope/revision, and acceptance criteria. A summary does not replace the actual patch/source; plans are supporting context only. Task and context together are limited to 64 KiB UTF-8; use lazy file references for large content.",
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
