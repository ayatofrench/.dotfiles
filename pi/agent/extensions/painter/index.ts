import type { AgentToolResult } from "@earendil-works/pi-agent-core";
import {
	DEFAULT_MAX_BYTES,
	DEFAULT_MAX_LINES,
	truncateHead,
	type ExtensionAPI,
	type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { runCodexBackend } from "./codex-backend.ts";
import { loadPainterConfig, type PainterConfig } from "./config.ts";
import {
	canUseDirectBackend,
	runDirectBackend,
	type PainterBackendResult,
} from "./direct-backend.ts";
import {
	displayPath,
	loadReferenceImages,
	withPainterOutputPath,
} from "./image-files.ts";

interface PainterDetails {
	readonly backend?: "pi" | "codex";
	readonly model?: string;
	readonly outputPath?: string;
	readonly configPath: string;
}

/** Register the blocking Amp-style Painter tool. */
export default function registerPainter(pi: ExtensionAPI): void {
	const globalConfig = loadPainterConfig(process.cwd(), false);
	pi.registerTool({
		name: "painter",
		label: "Painter",
		description: globalConfig.description,
		promptSnippet: "Generate or edit raster images using a configured Pi image model or Codex subscription",
		promptGuidelines: [
			"Use painter for raster image generation and editing; provide up to three workspace image paths as references.",
		],
		parameters: Type.Object({
			prompt: Type.String({
				description: "Complete visual request, including exact text, composition, style, and edit invariants",
			}),
			images: Type.Optional(Type.Array(Type.String(), {
				description: "Up to 3 workspace-local reference images or edit targets",
				maxItems: 3,
			})),
			outputPath: Type.Optional(Type.String({
				description: "Workspace-local PNG destination; existing files are preserved with a versioned sibling",
			})),
		}),
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			if (!params.prompt.trim()) {
				throw new Error("Painter prompt must not be empty");
			}
			const config = loadPainterConfig(ctx.cwd, ctx.isProjectTrusted());
			const references = await loadReferenceImages(params.images ?? [], ctx.cwd);
			onUpdate?.({
				content: [{ type: "text", text: "Painter is generating an image…" }],
				details: { configPath: config.filePath },
			});

			return withPainterOutputPath(
				params.outputPath,
				ctx.cwd,
				toolCallId,
				async (outputPath) => {
					const result = await runConfiguredBackend(
						pi,
						config,
						params.prompt.trim(),
						references,
						outputPath,
						ctx,
						signal,
					);
					return toToolResult(result, outputPath, config, ctx.cwd);
				},
			);
		},
	});
}

async function runConfiguredBackend(
	pi: ExtensionAPI,
	config: PainterConfig,
	prompt: string,
	references: Awaited<ReturnType<typeof loadReferenceImages>>,
	outputPath: string,
	ctx: ExtensionContext,
	signal?: AbortSignal,
): Promise<PainterBackendResult> {
	if (config.backend === "pi") {
		return runDirectBackend(config, prompt, references, outputPath, ctx, signal);
	}
	if (config.backend === "codex") {
		return runCodexBackend(pi, config, prompt, references, outputPath, signal);
	}
	if (await canUseDirectBackend(config, ctx)) {
		return runDirectBackend(config, prompt, references, outputPath, ctx, signal);
	}
	return runCodexBackend(pi, config, prompt, references, outputPath, signal);
}

function toToolResult(
	result: PainterBackendResult,
	outputPath: string,
	config: PainterConfig,
	cwd: string,
): AgentToolResult<PainterDetails> {
	const displayedPath = displayPath(outputPath, cwd);
	const summaryParts = [
		`Generated image: ${displayedPath}`,
		`Backend: ${result.backend}`,
		`Model: ${result.model}`,
	];
	if (result.notes) {
		const notes = truncateHead(result.notes, {
			maxBytes: DEFAULT_MAX_BYTES,
			maxLines: DEFAULT_MAX_LINES,
		});
		summaryParts.push(`Backend notes:\n${notes.content}`);
	}
	const toolResult: AgentToolResult<PainterDetails> = {
		content: [
			{ type: "text", text: summaryParts.join("\n") },
			result.image,
		],
		details: {
			backend: result.backend,
			model: result.model,
			outputPath,
			configPath: config.filePath,
		},
	};
	if (result.usage) toolResult.usage = result.usage;
	return toolResult;
}
