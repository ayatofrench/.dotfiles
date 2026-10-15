import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { getPackageDir, type ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ImageContent, ImagesProvider, Usage } from "@earendil-works/pi-ai";
import type { PainterConfig } from "./config.ts";
import type { PainterReferenceImage } from "./image-files.ts";
import { savePngImage } from "./image-files.ts";

/** Result produced by one Painter backend invocation. */
export interface PainterBackendResult {
	readonly backend: "pi" | "codex";
	readonly model: string;
	readonly image: ImageContent;
	readonly notes?: string | undefined;
	readonly usage?: Usage | undefined;
}

let openRouterImagesProviderModule: Promise<{
	readonly openrouterImagesProvider: () => ImagesProvider;
}> | undefined;

/** Report whether the configured Pi image provider has usable authentication. */
export async function canUseDirectBackend(
	config: PainterConfig,
	ctx: ExtensionContext,
): Promise<boolean> {
	const modelReference = requireModelReference(config);
	const { providerId } = splitModelReference(modelReference);
	if (providerId !== "openrouter") return false;
	return (await ctx.modelRegistry.getProviderAuth(providerId)) !== undefined;
}

/** Generate or edit an image through Pi's configured OpenRouter image provider. */
export async function runDirectBackend(
	config: PainterConfig,
	prompt: string,
	references: readonly PainterReferenceImage[],
	outputPath: string,
	ctx: ExtensionContext,
	signal?: AbortSignal,
): Promise<PainterBackendResult> {
	const modelReference = requireModelReference(config);
	const { providerId, modelId } = splitModelReference(modelReference);
	if (providerId !== "openrouter") {
		throw new Error(
			`Painter's Pi backend currently supports openrouter image models; configured: ${modelReference}`,
		);
	}

	const provider = (await loadOpenRouterImagesProvider()).openrouterImagesProvider();
	const model = provider.getModels().find((candidate) => candidate.id === modelId);
	if (!model) {
		throw new Error(`Unknown Pi image model: ${modelReference}`);
	}
	const auth = await ctx.modelRegistry.getProviderAuth(providerId);
	if (!auth) {
		throw new Error(`Painter has no configured authentication for provider: ${providerId}`);
	}

	const requestModel = auth.auth.baseUrl
		? { ...model, baseUrl: auth.auth.baseUrl }
		: model;
	const effectivePrompt = config.instructions
		? `${config.instructions}\n\nRequest:\n${prompt}`
		: prompt;
	const result = await provider.generateImages(
		requestModel,
		{
			input: [
				{ type: "text", text: effectivePrompt },
				...references.map((reference) => reference.content),
			],
		},
		{
			...(auth.auth.apiKey ? { apiKey: auth.auth.apiKey } : {}),
			...(auth.auth.headers ? { headers: auth.auth.headers } : {}),
			...(auth.env ? { env: auth.env } : {}),
			...(signal ? { signal } : {}),
			timeoutMs: 600_000,
		},
	);
	if (result.stopReason === "aborted") {
		throw new Error("Painter was cancelled");
	}
	if (result.stopReason === "error") {
		throw new Error(result.errorMessage || "Painter image generation failed");
	}

	const image = result.output.find((item): item is ImageContent => item.type === "image");
	if (!image) {
		const notes = result.output
			.filter((item) => item.type === "text")
			.map((item) => item.text)
			.join("\n")
			.trim();
		throw new Error(notes || "Painter image model returned no image");
	}
	const savedImage = await savePngImage(image, outputPath);
	const notes = result.output
		.filter((item) => item.type === "text")
		.map((item) => item.text)
		.join("\n")
		.trim();

	return {
		backend: "pi",
		model: modelReference,
		image: savedImage,
		notes: notes || undefined,
		usage: result.usage,
	};
}

async function loadOpenRouterImagesProvider(): Promise<{
	readonly openrouterImagesProvider: () => ImagesProvider;
}> {
	openRouterImagesProviderModule ??= import(
		pathToFileURL(join(
			getPackageDir(),
			"node_modules",
			"@earendil-works",
			"pi-ai",
			"dist",
			"providers",
			"openrouter-images.js",
		)).href
	);
	return openRouterImagesProviderModule;
}

function requireModelReference(config: PainterConfig): string {
	if (!config.model) {
		throw new Error(`Painter configuration ${config.filePath} does not declare a model`);
	}
	return config.model;
}

function splitModelReference(reference: string): {
	readonly providerId: string;
	readonly modelId: string;
} {
	const separator = reference.indexOf("/");
	if (separator <= 0 || separator === reference.length - 1) {
		throw new Error(`Painter model must use provider/model format: ${reference}`);
	}
	return {
		providerId: reference.slice(0, separator),
		modelId: reference.slice(separator + 1),
	};
}
