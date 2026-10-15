import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { PainterConfig } from "./config.ts";
import type { PainterBackendResult } from "./direct-backend.ts";
import type { PainterReferenceImage } from "./image-files.ts";
import { readGeneratedPng } from "./image-files.ts";

/** Generate or edit an image through Codex's subscription-backed native image_gen tool. */
export async function runCodexBackend(
	pi: ExtensionAPI,
	config: PainterConfig,
	prompt: string,
	references: readonly PainterReferenceImage[],
	outputPath: string,
	signal?: AbortSignal,
): Promise<PainterBackendResult> {
	const temporaryDirectory = await mkdtemp(join(tmpdir(), "pi-painter-codex-"));
	const lastMessagePath = join(temporaryDirectory, "last-message.txt");
	const args = [
		"exec",
		"--profile",
		"default",
		"--ephemeral",
		"--skip-git-repo-check",
		"--ignore-rules",
		"--sandbox",
		"workspace-write",
		"--enable",
		"image_generation",
		"--cd",
		temporaryDirectory,
		"--add-dir",
		dirname(outputPath),
		"--output-last-message",
		lastMessagePath,
	];
	for (const reference of references) {
		args.push("--image", reference.absolutePath);
	}
	args.push(buildCodexPrompt(config, prompt, references, outputPath));

	try {
		const result = await pi.exec("codex", args, {
			...(signal ? { signal } : {}),
			timeout: 600_000,
		});
		if (signal?.aborted) {
			throw new Error("Painter was cancelled");
		}
		if (result.code !== 0) {
			const diagnostic = result.stderr.trim() || result.stdout.trim();
			throw new Error(
				diagnostic
					? `Codex Painter failed: ${diagnostic.slice(-4_000)}`
					: `Codex Painter exited with code ${result.code}`,
			);
		}

		const image = await readGeneratedPng(outputPath);
		const notes = await readOptionalText(lastMessagePath);
		return {
			backend: "codex",
			model: "codex/image_gen",
			image,
			notes,
		};
	} finally {
		await rm(temporaryDirectory, { recursive: true, force: true });
	}
}

function buildCodexPrompt(
	config: PainterConfig,
	prompt: string,
	references: readonly PainterReferenceImage[],
	outputPath: string,
): string {
	const referenceDescription = references.length === 0
		? "No reference images were provided."
		: `${references.length} reference image(s) are attached in the same order supplied by the caller.`;
	const instructions = config.instructions
		? `Painter instructions:\n${config.instructions}\n\n`
		: "";
	return [
		"Use the built-in imagegen skill and native image_gen tool to produce exactly one final raster image.",
		"Do not edit or create any file except the exact output path below.",
		"Do not substitute SVG, HTML, CSS, canvas, or a placeholder for image generation.",
		"If reference images are attached, use them according to the request and preserve unspecified details for edits.",
		instructions,
		`Request:\n${prompt}`,
		referenceDescription,
		`Save the final selected image as a PNG at this exact path:\n${outputPath}`,
		"Before finishing, verify that the file exists and is a valid non-empty PNG. Report the path in the final response.",
	].filter((line) => line.length > 0).join("\n\n");
}

async function readOptionalText(path: string): Promise<string | undefined> {
	try {
		const content = (await readFile(path, "utf8")).trim();
		return content || undefined;
	} catch (cause: unknown) {
		if (isFileNotFound(cause)) return undefined;
		throw cause;
	}
}

function isFileNotFound(cause: unknown): boolean {
	return cause instanceof Error && "code" in cause && cause.code === "ENOENT";
}
