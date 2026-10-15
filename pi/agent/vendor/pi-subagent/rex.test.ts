import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createRexSession, findRexSession, killRexSession, rexSessionRunning } from "./rex.ts";

const integration = process.env.RUN_REX_TESTS === "1";

test("an unavailable Rex server is an explicit failure, not a missing session", {
	skip: !integration,
}, () => {
	const result = spawnSync(
		process.execPath,
		[
			"--input-type=module",
			"-e",
			`
		import {findRexSession, killRexSession, rexSessionRunning} from ${JSON.stringify(new URL("./rex.ts", import.meta.url).href)};
		console.log(JSON.stringify([findRexSession("missing"), killRexSession("missing"), rexSessionRunning("missing")]));
	`,
		],
		{
			encoding: "utf8",
			timeout: 10_000,
			env: { ...process.env, REX_SERVER: "127.0.0.1:1" },
		},
	);
	assert.equal(result.status, 0, result.stderr);
	const outcomes: unknown = JSON.parse(result.stdout);
	assert.ok(Array.isArray(outcomes));
	assert.equal(outcomes.length, 3);
	for (const outcome of outcomes) {
		assert.equal(outcome.ok, false);
		assert.equal(outcome.error.kind, "command");
	}
});

async function eventually(predicate: () => boolean): Promise<void> {
	for (let attempt = 0; attempt < 100; attempt++) {
		if (predicate()) return;
		await delay(50);
	}
	assert.fail("Condition did not become true within 5 seconds");
}

test("Rex creates a detached child with literal arguments and stops only its own session", {
	skip: !integration,
}, async () => {
	const cwd = mkdtempSync(join(tmpdir(), "pi-subagent-rex-"));
	const label = `pi-subagent-test-${randomUUID()}`;
	const output = join(cwd, "observed.json");
	const literal = "spaces ' quotes ; $(touch should-not-exist)\nsecond line";
	const created = createRexSession(label, cwd, [
		"/usr/bin/env",
		"PI_SUBAGENT_RUN_DIR=literal value",
		process.execPath,
		"--input-type=module",
		"-e",
		"import {writeFileSync} from 'node:fs'; writeFileSync('observed.json', JSON.stringify({cwd:process.cwd(), arg:process.argv[1], env:process.env.PI_SUBAGENT_RUN_DIR})); setInterval(()=>{},1000)",
		literal,
	]);
	assert.equal(created.ok, true, JSON.stringify(created));
	if (!created.ok) return;
	try {
		await eventually(() => existsSync(output));
		assert.deepEqual(JSON.parse(readFileSync(output, "utf8")), {
			cwd: realpathSync(cwd),
			arg: literal,
			env: "literal value",
		});
		assert.deepEqual(findRexSession(label), { ok: true, value: created.value });
		assert.deepEqual(rexSessionRunning(created.value), {
			ok: true,
			value: true,
		});
		assert.equal(existsSync(join(cwd, "should-not-exist")), false);
	} finally {
		assert.deepEqual(killRexSession(created.value), {
			ok: true,
			value: undefined,
		});
		rmSync(cwd, { recursive: true, force: true });
	}
	assert.deepEqual(findRexSession(created.value), {
		ok: true,
		value: undefined,
	});
	assert.deepEqual(killRexSession(created.value), {
		ok: true,
		value: undefined,
	});
});

test("Rex's empty session is not a running child", {
	skip: !integration,
}, async () => {
	const label = `pi-subagent-test-${randomUUID()}`;
	const created = createRexSession(label, tmpdir(), [process.execPath, "-e", "process.exit(0)"]);
	assert.equal(created.ok, true, JSON.stringify(created));
	if (!created.ok) return;
	try {
		await eventually(() => {
			const running = rexSessionRunning(created.value);
			return running.ok && !running.value;
		});
		assert.deepEqual(findRexSession(label), { ok: true, value: created.value });
	} finally {
		assert.deepEqual(killRexSession(created.value), {
			ok: true,
			value: undefined,
		});
	}
});
