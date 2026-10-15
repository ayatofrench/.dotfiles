import { createRexSession, rexSessionRunning, killRexSession } from "./rex.ts";
import {
	accessSync,
	constants,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type RunState = "starting" | "busy" | "idle" | "exited" | "error";

export interface RunMetadata {
	version: 1;
	handle: string;
	name?: string | undefined;
	parentSessionId?: string | undefined;
	parentSessionFile?: string | undefined;
	childSessionId?: string | undefined;
	rexSession: string;
	runDir: string;
	sessionFile: string;
	cwd: string;
	provider: string;
	model: string;
	thinking: string;
	/** Extra pi CLI flags (tools, isolation) reused when the run is relaunched. */
	launchArgs?: string[] | undefined;
	/** Set by the parent when it stops the child on quit or session switch; the child is relaunched on resume. */
	suspended?: boolean | undefined;
	state: RunState;
	hasStarted: boolean;
	createdAt: string;
	updatedAt: string;
	error?: string | undefined;
}

export interface InboxMessage {
	message: string;
	delivery: "auto" | "followUp";
}

interface SessionEntry {
	type: string;
	id: string;
	parentId: string | null;
	message?: unknown;
}

interface AssistantMessage {
	role: "assistant";
	content?: unknown;
	stopReason?: string;
	errorMessage?: string;
}

interface AssistantEntry extends SessionEntry {
	type: "message";
	message: AssistantMessage;
}

export function getAgentDir(): string {
	return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
}

export function getRunsDir(): string {
	return join(getAgentDir(), "subagents");
}

export function metadataPath(runDir: string): string {
	return join(runDir, "metadata.json");
}

export function inboxDir(runDir: string): string {
	return join(runDir, "inbox");
}

export function isValidRunName(value: unknown): value is string {
	return (
		typeof value === "string" &&
		value.length > 0 &&
		value.length <= 64 &&
		value.trim() === value &&
		!/[\u0000-\u001f\u007f]/.test(value)
	);
}

export function runDisplayName(metadata: RunMetadata): string {
	return metadata.name ? `${metadata.name} (${metadata.handle})` : metadata.handle;
}

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): value is string | undefined {
	return value === undefined || typeof value === "string";
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
	return value === undefined || (Array.isArray(value) && value.every((item: unknown) => typeof item === "string"));
}

function isRunState(value: unknown): value is RunState {
	return value === "starting" || value === "busy" || value === "idle" || value === "exited" || value === "error";
}

export function readMetadata(runDir: string): RunMetadata | undefined {
	try {
		const value: unknown = JSON.parse(readFileSync(metadataPath(runDir), "utf8"));
		if (typeof value !== "object" || value === null) return undefined;
		if (!isMetadataRecord(value)) return undefined;
		if (
			value.version !== 1 ||
			typeof value.handle !== "string" ||
			!/^[a-z0-9]+$/.test(value.handle) ||
			(value.name !== undefined && !isValidRunName(value.name)) ||
			!isOptionalString(value.parentSessionId) ||
			!isOptionalString(value.parentSessionFile) ||
			!isOptionalString(value.childSessionId) ||
			typeof value.rexSession !== "string" ||
			typeof value.sessionFile !== "string" ||
			typeof value.runDir !== "string" ||
			typeof value.cwd !== "string" ||
			typeof value.provider !== "string" ||
			typeof value.model !== "string" ||
			typeof value.thinking !== "string" ||
			!isOptionalStringArray(value.launchArgs) ||
			(value.suspended !== undefined && typeof value.suspended !== "boolean") ||
			!isRunState(value.state) ||
			typeof value.hasStarted !== "boolean" ||
			typeof value.createdAt !== "string" ||
			typeof value.updatedAt !== "string" ||
			!isOptionalString(value.error)
		)
			return undefined;
		return {
			version: 1,
			handle: value.handle,
			name: value.name,
			parentSessionId: value.parentSessionId,
			parentSessionFile: value.parentSessionFile,
			childSessionId: value.childSessionId,
			rexSession: value.rexSession,
			sessionFile: value.sessionFile,
			runDir: value.runDir,
			cwd: value.cwd,
			provider: value.provider,
			model: value.model,
			thinking: value.thinking,
			launchArgs: value.launchArgs,
			suspended: value.suspended,
			state: value.state,
			hasStarted: value.hasStarted,
			createdAt: value.createdAt,
			updatedAt: value.updatedAt,
			error: value.error,
		};
	} catch {
		return undefined;
	}
}

export function writeMetadata(metadata: RunMetadata): void {
	mkdirSync(dirname(metadataPath(metadata.runDir)), {
		recursive: true,
		mode: 0o700,
	});
	const target = metadataPath(metadata.runDir);
	const temporary = `${target}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
	writeFileSync(temporary, `${JSON.stringify(metadata, null, 2)}\n`, {
		encoding: "utf8",
		mode: 0o600,
	});
	renameSync(temporary, target);
}

export function updateMetadata(runDir: string, patch: Partial<RunMetadata>): RunMetadata | undefined {
	const current = readMetadata(runDir);
	if (!current) return undefined;
	const next: RunMetadata = {
		...current,
		...patch,
		version: 1,
		handle: current.handle,
		runDir: current.runDir,
		updatedAt: new Date().toISOString(),
	};
	writeMetadata(next);
	return next;
}

export async function waitForRunShutdown(runDir: string, timeoutMs = 2000): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const metadata = readMetadata(runDir);
		if (!metadata || metadata.state === "exited") return;
		await new Promise<void>((resolveDelay) => setTimeout(resolveDelay, 50));
	}
}

export function removeRunDir(runDir: string): void {
	rmSync(runDir, {
		recursive: true,
		force: true,
		maxRetries: 10,
		retryDelay: 50,
	});
}

/** Translate Rex failures at the existing exception-based lifecycle boundary. */
export function rexSessionExists(session: string): boolean {
	const result = rexSessionRunning(session);
	if (!result.ok) throw new Error(result.error.message);
	return result.value;
}

/** Stop a child without discarding metadata if Rex is unavailable. */
export function stopRun(metadata: RunMetadata): void {
	const result = killRexSession(metadata.rexSession);
	if (!result.ok) throw new Error(result.error.message);
}

/** Start the child Pi process in Rex. `initialArgs` are only passed on first spawn. */
export function launchRun(metadata: RunMetadata, initialArgs: string[] = []): void {
	let launcher = "pi";
	const testLauncher = join(metadata.cwd, "pi-test.sh");
	try {
		accessSync(testLauncher, constants.X_OK);
		launcher = testLauncher;
	} catch {
		// Use the installed pi executable.
	}

	// Rex starts commands in the server environment, not this CLI's environment.
	const environment = [
		`PATH=${process.env.PATH ?? ""}`,
		`PI_CODING_AGENT_DIR=${getAgentDir()}`,
		`PI_SUBAGENT_RUN_DIR=${metadata.runDir}`,
	];
	const result = createRexSession(`pi-subagent-${metadata.handle}`, metadata.cwd, [
		"/usr/bin/env",
		...environment,
		launcher,
		"--session",
		metadata.sessionFile,
		"--provider",
		metadata.provider,
		"--model",
		metadata.model,
		"--thinking",
		metadata.thinking,
		...(metadata.launchArgs ?? []),
		...initialArgs,
	]);
	if (!result.ok) throw new Error(result.error.message);
	// Merge with the latest child metadata: the bridge can start before rex new returns.
	try {
		if (!updateMetadata(metadata.runDir, { rexSession: result.value })) {
			throw new Error("Subagent metadata disappeared during launch");
		}
	} catch (error) {
		killRexSession(result.value);
		throw error;
	}
}

export function effectiveRunState(metadata: RunMetadata): RunState {
	if (
		(metadata.state === "starting" || metadata.state === "busy" || metadata.state === "idle") &&
		!rexSessionExists(metadata.rexSession)
	) {
		return "exited";
	}
	return metadata.state;
}

export function listRuns(parentSessionId?: string): RunMetadata[] {
	const root = getRunsDir();
	if (!existsSync(root)) return [];
	const runs: RunMetadata[] = [];
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const metadata = readMetadata(join(root, entry.name));
		if (!metadata) continue;
		if (parentSessionId && metadata.parentSessionId !== parentSessionId) continue;
		runs.push(metadata);
	}
	return runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function isSessionEntry(value: unknown): value is SessionEntry {
	if (typeof value !== "object" || value === null) return false;
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.type === "string" &&
		typeof entry.id === "string" &&
		(entry.parentId === null || typeof entry.parentId === "string")
	);
}

function activeBranch(entries: SessionEntry[]): SessionEntry[] {
	const byId = new Map(entries.map((entry) => [entry.id, entry]));
	const branch: SessionEntry[] = [];
	const seen = new Set<string>();
	let current = entries.at(-1);
	while (current && !seen.has(current.id)) {
		branch.push(current);
		seen.add(current.id);
		current = current.parentId === null ? undefined : byId.get(current.parentId);
	}
	return branch.reverse();
}

function isAssistantEntry(entry: SessionEntry): entry is AssistantEntry {
	if (entry.type !== "message" || typeof entry.message !== "object" || entry.message === null) return false;
	return (entry.message as Record<string, unknown>).role === "assistant";
}

export function readLatestAssistant(sessionFile: string): AssistantMessage | undefined {
	let content: string;
	try {
		content = readFileSync(sessionFile, "utf8");
	} catch {
		return undefined;
	}
	const entries: SessionEntry[] = [];
	for (const line of content.split("\n")) {
		if (!line.trim()) continue;
		try {
			const value: unknown = JSON.parse(line);
			if (isSessionEntry(value)) entries.push(value);
		} catch {
			// The final JSONL record may still be in the process of being appended.
		}
	}
	return activeBranch(entries).findLast(isAssistantEntry)?.message;
}

export function assistantText(message: AssistantMessage): string {
	if (!Array.isArray(message.content)) return message.errorMessage ?? "(no response text)";
	const parts: string[] = [];
	for (const item of message.content) {
		if (typeof item !== "object" || item === null) continue;
		const block = item as Record<string, unknown>;
		if (block.type === "text" && typeof block.text === "string") parts.push(block.text);
	}
	return parts.join("\n").trim() || message.errorMessage || "(no response text)";
}
