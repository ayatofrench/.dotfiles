import { constants } from "node:fs";
import { access, stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

/** Maximum UTF-8 bytes accepted across a subagent task and its inline context. */
export const MAX_INLINE_INPUT_BYTES = 64 * 1024;

/** Maximum number of lazy file references accepted by one subagent call. */
export const MAX_FILE_REFERENCES = 50;

/** Root used to resolve a relative subagent file reference. */
export type FileReferenceRoot = "child" | "parent";

/** A file the child may inspect lazily with its bounded read tools. */
export interface FileReferenceInput {
	readonly path: string;
	readonly relativeTo?: FileReferenceRoot | undefined;
}

/** Advisory filesystem state captured before the child starts. */
export interface FileReferenceStatus {
	readonly requestedPath: string;
	readonly relativeTo: FileReferenceRoot;
	readonly readPath: string;
	readonly status: "available" | "unavailable" | "not-file" | "unreadable";
	readonly sizeBytes?: number | undefined;
	readonly errorCode?: string | undefined;
}

/** Prepared prompt and ingress metadata for one isolated child session. */
export interface PreparedSubagentPrompt {
	readonly prompt: string;
	readonly inlineBytes: number;
	readonly fileReferences: readonly FileReferenceStatus[];
}

/** Input rejected because its eager inline text exceeds the documented budget. */
export class InlineInputTooLargeError extends Error {
	readonly _tag = "InlineInputTooLargeError" as const;
	readonly actualBytes: number;
	readonly maximumBytes: number;

	constructor(actualBytes: number, maximumBytes: number) {
		super(
			`Subagent inline task and context use ${actualBytes} UTF-8 bytes; the limit is ${maximumBytes}. Save large content to a file and pass it as a lazy file reference.`,
		);
		this.name = "InlineInputTooLargeError";
		this.actualBytes = actualBytes;
		this.maximumBytes = maximumBytes;
	}
}

/** Input rejected because it contains too many file references. */
export class TooManyFileReferencesError extends Error {
	readonly _tag = "TooManyFileReferencesError" as const;
	readonly actualCount: number;
	readonly maximumCount: number;

	constructor(actualCount: number, maximumCount: number) {
		super(`Subagent call contains ${actualCount} file references; the limit is ${maximumCount}.`);
		this.name = "TooManyFileReferencesError";
		this.actualCount = actualCount;
		this.maximumCount = maximumCount;
	}
}

/**
 * Build a bounded child prompt without loading referenced file contents.
 *
 * Relative references default to the child working directory. Callers must use
 * `relativeTo: "parent"` for artifacts owned by the parent workspace.
 */
export async function prepareSubagentPrompt(
	input: {
		readonly task: string;
		readonly context?: string | undefined;
		readonly files?: readonly FileReferenceInput[] | undefined;
	},
	roots: { readonly parentCwd: string; readonly childCwd: string },
): Promise<PreparedSubagentPrompt> {
	const task = input.task.trim();
	const context = input.context?.trim();
	const inlineBytes = Buffer.byteLength(`${task}${context ?? ""}`, "utf8");
	if (inlineBytes > MAX_INLINE_INPUT_BYTES) {
		throw new InlineInputTooLargeError(inlineBytes, MAX_INLINE_INPUT_BYTES);
	}

	const files = input.files ?? [];
	if (files.length > MAX_FILE_REFERENCES) {
		throw new TooManyFileReferencesError(files.length, MAX_FILE_REFERENCES);
	}

	const fileReferences = await Promise.all(
		files.map((file) => inspectFileReference(file, roots)),
	);
	const sections = [`## Task\n${task}`];
	if (context) {
		sections.push(`## Context\n${context}`);
	}
	if (fileReferences.length > 0) {
		sections.push(renderFileReferenceManifest(fileReferences, roots));
	}

	return {
		prompt: sections.join("\n\n"),
		inlineBytes,
		fileReferences,
	};
}

async function inspectFileReference(
	input: FileReferenceInput,
	roots: { readonly parentCwd: string; readonly childCwd: string },
): Promise<FileReferenceStatus> {
	const requestedPath = stripLeadingAt(input.path);
	const relativeTo = input.relativeTo ?? "child";
	const base = relativeTo === "parent" ? roots.parentCwd : roots.childCwd;
	const readPath = isAbsolute(requestedPath)
		? resolve(requestedPath)
		: resolve(base, requestedPath);

	try {
		const info = await stat(readPath);
		if (!info.isFile()) {
			return { requestedPath, relativeTo, readPath, status: "not-file" };
		}
		try {
			await access(readPath, constants.R_OK);
		} catch (cause: unknown) {
			return {
				requestedPath,
				relativeTo,
				readPath,
				status: "unreadable",
				errorCode: getErrorCode(cause),
			};
		}
		return {
			requestedPath,
			relativeTo,
			readPath,
			status: "available",
			sizeBytes: info.size,
		};
	} catch (cause: unknown) {
		return {
			requestedPath,
			relativeTo,
			readPath,
			status: "unavailable",
			errorCode: getErrorCode(cause),
		};
	}
}

function renderFileReferenceManifest(
	files: readonly FileReferenceStatus[],
	roots: { readonly parentCwd: string; readonly childCwd: string },
): string {
	const manifest = {
		parentWorkingDirectory: roots.parentCwd,
		childWorkingDirectory: roots.childCwd,
		files,
	};
	return [
		"## File References",
		"File contents are not embedded in this prompt. Inspect only what you need with the bounded read, grep, and find tools. Use each readPath exactly as listed. Preflight status is advisory because files may change after startup. Do not claim to have inspected an unavailable file; locate the correct file or report the missing input.",
		"```json",
		JSON.stringify(manifest, null, 2),
		"```",
	].join("\n");
}

function stripLeadingAt(path: string): string {
	return path.startsWith("@") ? path.slice(1) : path;
}

function getErrorCode(cause: unknown): string | undefined {
	if (
		typeof cause === "object" &&
		cause !== null &&
		"code" in cause &&
		typeof cause.code === "string"
	) {
		return cause.code;
	}
	return undefined;
}
