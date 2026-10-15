import { spawnSync } from "node:child_process";

/** A Rex control failure. An unavailable server is never treated as an absent session. */
export interface RexFailure {
	readonly kind: "command" | "protocol";
	readonly message: string;
}

/** Rex operations return explicit failures for the CLI and extension to report. */
export type RexResult<T> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: RexFailure };

interface RexSession {
	readonly id: string;
	readonly label: string;
}

/** Pin control and interactive commands to the server that owns the parent terminal. */
export function rexConnectionArgs(): string[] {
	return process.env.REX_SERVER ? ["--server", process.env.REX_SERVER] : [];
}

function command(args: string[]): RexResult<string> {
	const result = spawnSync("rex", [...rexConnectionArgs(), ...args], {
		encoding: "utf8",
		timeout: 15_000,
	});
	if (result.error || result.status !== 0) {
		return {
			ok: false,
			error: {
				kind: "command",
				message: result.error?.message || result.stderr.trim() || "Rex command failed",
			},
		};
	}
	return { ok: true, value: result.stdout };
}

function jsonCommand(args: string[]): RexResult<unknown> {
	const result = command(args);
	if (!result.ok) return result;
	try {
		const value: unknown = JSON.parse(result.value);
		return { ok: true, value };
	} catch {
		return {
			ok: false,
			error: { kind: "protocol", message: "Rex returned invalid JSON" },
		};
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSessionId(value: unknown): value is string {
	return typeof value === "string" && /^session:[a-f0-9-]+$/.test(value);
}

function listSessions(): RexResult<readonly RexSession[]> {
	const result = jsonCommand(["ls", "--json"]);
	if (!result.ok) return result;
	if (!isRecord(result.value) || !Array.isArray(result.value.sessions)) {
		return {
			ok: false,
			error: {
				kind: "protocol",
				message: "Rex returned an invalid session list",
			},
		};
	}
	const sessions: RexSession[] = [];
	for (const item of result.value.sessions) {
		if (!isRecord(item) || !isSessionId(item.session_id) || typeof item.label !== "string") {
			return {
				ok: false,
				error: { kind: "protocol", message: "Rex returned an invalid session" },
			};
		}
		sessions.push({ id: item.session_id, label: item.label });
	}
	return { ok: true, value: sessions };
}

/** Look up an exact session ID or label; refuse ambiguous labels. */
export function findRexSession(session: string): RexResult<string | undefined> {
	const result = listSessions();
	if (!result.ok) return result;
	const matches = result.value.filter((candidate) => candidate.id === session || candidate.label === session);
	if (matches.length > 1) {
		return {
			ok: false,
			error: { kind: "protocol", message: "Rex session label is ambiguous" },
		};
	}
	return { ok: true, value: matches[0]?.id };
}

/** Create a detached session with literal argv, not a shell-interpreted command. */
export function createRexSession(label: string, cwd: string, argv: string[]): RexResult<string> {
	const result = jsonCommand(["new", label, "--cwd", cwd, "--shell", "none", "--json", "--", ...argv]);
	if (!result.ok) return result;
	if (!isRecord(result.value) || !isSessionId(result.value.session_id)) {
		return {
			ok: false,
			error: {
				kind: "protocol",
				message: "Rex returned an invalid new session ID",
			},
		};
	}
	return { ok: true, value: result.value.session_id };
}

/** Report a live child terminal, not an empty session left behind after process exit. */
export function rexSessionRunning(session: string): RexResult<boolean> {
	const found = findRexSession(session);
	if (!found.ok) return found;
	if (found.value === undefined) return { ok: true, value: false };
	const result = jsonCommand(["block", "ls", "--session", found.value, "--json"]);
	if (!result.ok) return result;
	if (!isRecord(result.value) || !Array.isArray(result.value.blocks)) {
		return {
			ok: false,
			error: {
				kind: "protocol",
				message: "Rex returned an invalid block list",
			},
		};
	}
	for (const block of result.value.blocks) {
		if (!isRecord(block) || typeof block.block_id !== "string") {
			return {
				ok: false,
				error: { kind: "protocol", message: "Rex returned an invalid block" },
			};
		}
	}
	return { ok: true, value: result.value.blocks.length > 0 };
}

/** Kill only the exact resolved session. Missing sessions are already stopped. */
export function killRexSession(session: string): RexResult<void> {
	const found = findRexSession(session);
	if (!found.ok) return found;
	if (found.value === undefined) return { ok: true, value: undefined };
	const result = command(["kill", found.value]);
	return result.ok ? { ok: true, value: undefined } : result;
}

/** Select a session in the Rex app. Rex honors REX_CLIENT, or selects the single connected app. */
export function selectRexSession(session: string): RexResult<void> {
	const found = findRexSession(session);
	if (!found.ok) return found;
	if (!found.value)
		return {
			ok: false,
			error: { kind: "command", message: "Rex session is no longer running" },
		};
	const result = command(["do", "session.select", "--args", JSON.stringify({ session_id: found.value })]);
	return result.ok ? { ok: true, value: undefined } : result;
}
