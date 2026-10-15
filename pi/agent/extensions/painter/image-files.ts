import { existsSync } from "node:fs";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { convertToPng, withFileMutationQueue } from "@earendil-works/pi-coding-agent";
import type { ImageContent } from "@earendil-works/pi-ai";

const MAX_REFERENCE_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_TOTAL_REFERENCE_BYTES = 30 * 1024 * 1024;

/** Parsed reference image accepted by both Painter backends. */
export interface PainterReferenceImage {
	readonly absolutePath: string;
	readonly content: ImageContent;
}

/** Resolve and parse up to three workspace-local reference images. */
export async function loadReferenceImages(
	paths: readonly string[],
	cwd: string,
): Promise<readonly PainterReferenceImage[]> {
	if (paths.length > 3) {
		throw new Error("Painter accepts at most 3 reference images");
	}

	let totalBytes = 0;
	const images: PainterReferenceImage[] = [];
	for (const inputPath of paths) {
		const absolutePath = await resolveExistingWorkspacePath(inputPath, cwd, "Reference image");
		const bytes = await readFile(absolutePath);
		if (bytes.byteLength > MAX_REFERENCE_IMAGE_BYTES) {
			throw new Error(`Reference image exceeds 15 MB: ${displayPath(absolutePath, cwd)}`);
		}
		totalBytes += bytes.byteLength;
		if (totalBytes > MAX_TOTAL_REFERENCE_BYTES) {
			throw new Error("Painter reference images exceed 30 MB in total");
		}
		const mimeType = detectImageMimeType(bytes);
		if (!mimeType) {
			throw new Error(`Unsupported reference image: ${displayPath(absolutePath, cwd)}`);
		}
		images.push({
			absolutePath,
			content: { type: "image", data: bytes.toString("base64"), mimeType },
		});
	}
	return images;
}

/** Run one complete image mutation under Pi's per-file queue using a non-destructive PNG path. */
export async function withPainterOutputPath<T>(
	requestedPath: string | undefined,
	cwd: string,
	toolCallId: string,
	run: (outputPath: string) => Promise<T>,
): Promise<T> {
	const relativeDefault = `output/painter/painter-${sanitizeFileSegment(toolCallId)}.png`;
	const initialPath = resolveLexicalWorkspacePath(requestedPath?.trim() || relativeDefault, cwd, "Output path");
	const extension = extname(initialPath);
	const requestedPngPath = extension.toLowerCase() === ".png"
		? initialPath
		: `${extension ? initialPath.slice(0, -extension.length) : initialPath}.png`;
	await mkdir(dirname(requestedPngPath), { recursive: true });
	const [workspaceRoot, outputDirectory] = await Promise.all([
		realpath(cwd),
		realpath(dirname(requestedPngPath)),
	]);
	assertInsideWorkspace(outputDirectory, workspaceRoot, "Output path");
	const pngPath = join(outputDirectory, basename(requestedPngPath));

	return withFileMutationQueue(pngPath, async () => {
		return run(findAvailablePath(pngPath));
	});
}

/** Normalize generated image bytes to PNG and save them at a reserved path. */
export async function savePngImage(image: ImageContent, outputPath: string): Promise<ImageContent> {
	const png = image.mimeType === "image/png"
		? image
		: await convertToPng(image.data, image.mimeType);
	if (!png) {
		throw new Error(`Painter could not convert ${image.mimeType} output to PNG`);
	}
	await writeFile(outputPath, Buffer.from(png.data, "base64"));
	return { type: "image", data: png.data, mimeType: "image/png" };
}

/** Read a generated file, validate it as an image, and normalize it to PNG in place. */
export async function readGeneratedPng(outputPath: string): Promise<ImageContent> {
	const bytes = await readFile(outputPath);
	const mimeType = detectImageMimeType(bytes);
	if (!mimeType) {
		throw new Error(`Painter harness did not produce a supported image: ${outputPath}`);
	}
	return savePngImage(
		{ type: "image", data: bytes.toString("base64"), mimeType },
		outputPath,
	);
}

/** Render an absolute workspace path as a concise relative path when possible. */
export function displayPath(absolutePath: string, cwd: string): string {
	const workspaceRelative = relative(cwd, absolutePath);
	return workspaceRelative && !workspaceRelative.startsWith("..")
		? workspaceRelative
		: absolutePath;
}

async function resolveExistingWorkspacePath(inputPath: string, cwd: string, label: string): Promise<string> {
	const lexicalPath = resolveLexicalWorkspacePath(inputPath, cwd, label);
	const [workspaceRoot, absolutePath] = await Promise.all([realpath(cwd), realpath(lexicalPath)]);
	assertInsideWorkspace(absolutePath, workspaceRoot, label);
	return absolutePath;
}

function resolveLexicalWorkspacePath(inputPath: string, cwd: string, label: string): string {
	const absolutePath = isAbsolute(inputPath) ? resolve(inputPath) : resolve(cwd, inputPath);
	assertInsideWorkspace(absolutePath, resolve(cwd), label);
	return absolutePath;
}

function assertInsideWorkspace(path: string, workspaceRoot: string, label: string): void {
	const workspaceRelative = relative(workspaceRoot, path);
	if (
		isAbsolute(workspaceRelative)
		|| workspaceRelative === ".."
		|| workspaceRelative.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
	) {
		throw new Error(`${label} must stay inside the workspace: ${path}`);
	}
}

function findAvailablePath(path: string): string {
	if (!existsSync(path)) return path;
	const extension = extname(path);
	const stem = path.slice(0, -extension.length);
	for (let version = 2; version <= 999; version += 1) {
		const candidate = `${stem}-v${version}${extension}`;
		if (!existsSync(candidate)) return candidate;
	}
	throw new Error(`Painter could not reserve a non-destructive output path for: ${path}`);
}

function sanitizeFileSegment(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "-");
	return sanitized || "image";
}

function detectImageMimeType(bytes: Uint8Array): string | undefined {
	if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
	if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
	if (
		startsWith(bytes, [0x52, 0x49, 0x46, 0x46])
		&& bytes.length >= 12
		&& String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
	) return "image/webp";
	return undefined;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
	if (bytes.length < signature.length) return false;
	return signature.every((byte, index) => bytes[index] === byte);
}
