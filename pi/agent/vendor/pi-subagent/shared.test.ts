import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readMetadata, updateMetadata, writeMetadata, type RunMetadata } from "./shared.ts";

function fixture(runDir: string): RunMetadata {
	return {
		version: 1,
		handle: "abc123",
		rexSession: "pi-subagent-abc123",
		runDir,
		sessionFile: join(runDir, "session.jsonl"),
		cwd: runDir,
		provider: "test",
		model: "test",
		thinking: "medium",
		state: "starting",
		hasStarted: false,
		createdAt: "2026-10-15T00:00:00Z",
		updatedAt: "2026-10-15T00:00:00Z",
	};
}

test("Rex session ID updates preserve bridge state and can clear transient errors", () => {
	const runDir = mkdtempSync(join(tmpdir(), "pi-subagent-metadata-"));
	try {
		writeMetadata(fixture(runDir));
		updateMetadata(runDir, {
			state: "busy",
			childSessionId: "child",
			hasStarted: true,
			error: "temporary",
		});
		updateMetadata(runDir, { rexSession: "session:1234", error: undefined });
		const metadata = readMetadata(runDir);
		assert.ok(metadata);
		assert.equal(metadata.rexSession, "session:1234");
		assert.equal(metadata.state, "busy");
		assert.equal(metadata.childSessionId, "child");
		assert.equal(metadata.hasStarted, true);
		assert.equal(metadata.error, undefined);
	} finally {
		rmSync(runDir, { recursive: true, force: true });
	}
});

test("metadata parsing rejects malformed runtime fields and upstream tmux records", () => {
	const runDir = mkdtempSync(join(tmpdir(), "pi-subagent-metadata-"));
	try {
		for (const patch of [
			{ rexSession: undefined, tmuxSession: "old" },
			{ state: "not-a-state" },
			{ launchArgs: [1] },
			{ suspended: "yes" },
			{ provider: undefined },
			{ cwd: undefined },
			{ handle: "../escape" },
			{ hasStarted: "yes" },
		]) {
			writeFileSync(join(runDir, "metadata.json"), JSON.stringify({ ...fixture(runDir), ...patch }));
			assert.equal(readMetadata(runDir), undefined, JSON.stringify(patch));
		}
	} finally {
		rmSync(runDir, { recursive: true, force: true });
	}
});
