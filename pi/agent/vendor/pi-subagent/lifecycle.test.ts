import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { effectiveRunState, launchRun, readMetadata, stopRun, updateMetadata } from "./shared.ts";

const cli = new URL("./subagent.ts", import.meta.url);

function invoke(args: string[], agentDir: string) {
	return spawnSync(process.execPath, [cli.pathname, ...args], {
		encoding: "utf8",
		timeout: 10_000,
		env: {
			...process.env,
			PI_CODING_AGENT_DIR: agentDir,
			PI_SESSION_ID: "rex-test-parent",
			PI_SUBAGENT_RUN_DIR: "",
		},
	});
}

test("CLI spawn, status, send, wait, relaunch, and stop use durable Rex runs", {
	skip: process.env.RUN_REX_TESTS !== "1",
}, async () => {
	const root = realpathSync(mkdtempSync(join(tmpdir(), "pi-subagent-lifecycle-")));
	const agentDir = join(root, "agent");
	const fixture = join(root, "fixture.mjs");
	// The upstream launcher seam uses a local pi-test.sh. No model calls or nested agents run here.
	writeFileSync(
		fixture,
		`
import {readFileSync, writeFileSync, appendFileSync} from "node:fs";
const runDir = process.env.PI_SUBAGENT_RUN_DIR;
writeFileSync(runDir + "/launch.json", JSON.stringify({args:process.argv.slice(2), agentDir:process.env.PI_CODING_AGENT_DIR}));
setTimeout(() => {
  const path = runDir + "/metadata.json";
  const metadata = JSON.parse(readFileSync(path, "utf8"));
  if (process.argv.some(arg => arg.startsWith("Task:"))) {
    appendFileSync(metadata.sessionFile, JSON.stringify({type:"message", id:"answer", parentId:null, message:{role:"assistant", content:[{type:"text",text:"fixture result"}], stopReason:"stop"}}) + "\\n");
  }
  writeFileSync(path, JSON.stringify({...metadata, state:"idle", hasStarted:true, suspended:false}));
}, 200);
setInterval(() => {}, 1000);
`,
	);
	writeFileSync(join(root, "pi-test.sh"), `#!/bin/sh\nexec "${process.execPath}" "${fixture}" "$@"\n`, { mode: 0o700 });
	let runDir: string | undefined;
	try {
		const spawned = invoke(
			[
				"spawn",
				"--cwd",
				root,
				"--provider",
				"test",
				"--model",
				"test",
				"--name",
				"Rex test",
				"--no-extensions",
				"--prompt",
				"literal ' ; $(echo not-a-shell)",
			],
			agentDir,
		);
		assert.equal(spawned.status, 0, spawned.stderr);
		assert.match(spawned.stdout, /Attach: rex attach pi-subagent-/);
		const handles = readdirSync(join(agentDir, "subagents"));
		assert.equal(handles.length, 1);
		const handle = handles[0];
		assert.ok(handle);
		runDir = join(agentDir, "subagents", handle);
		for (let attempt = 0; attempt < 100 && readMetadata(runDir)?.state !== "idle"; attempt++) await delay(50);
		const metadata = readMetadata(runDir);
		assert.ok(metadata);
		assert.match(metadata.rexSession, /^session:/);
		assert.equal(effectiveRunState(metadata), "idle");
		const launch = JSON.parse(readFileSync(join(runDir, "launch.json"), "utf8"));
		assert.equal(launch.agentDir, agentDir);
		assert.ok(launch.args.includes("Task:\nliteral ' ; $(echo not-a-shell)"));
		assert.ok(launch.args.includes("--no-extensions"));
		assert.match(invoke(["status", handle], agentDir).stdout, /idle/);
		const waited = invoke(["wait", handle, "--timeout", "2"], agentDir);
		assert.equal(waited.status, 0, waited.stderr);
		assert.match(waited.stdout, /fixture result/);
		const sent = invoke(["send", handle, "--follow-up", "next task"], agentDir);
		assert.equal(sent.status, 0, sent.stderr);
		const inbox = readdirSync(join(runDir, "inbox"));
		assert.equal(inbox.length, 1);
		assert.deepEqual(JSON.parse(readFileSync(join(runDir, "inbox", inbox[0] ?? ""), "utf8")), {
			message: "next task",
			delivery: "followUp",
		});
		stopRun(metadata);
		assert.equal(effectiveRunState(metadata), "exited");
		assert.ok(existsSync(metadata.sessionFile));
		updateMetadata(runDir, { suspended: true, state: "starting" });
		rmSync(join(runDir, "launch.json"));
		launchRun(metadata);
		for (let attempt = 0; attempt < 100 && !existsSync(join(runDir, "launch.json")); attempt++) await delay(50);
		const resumed = readMetadata(runDir);
		assert.ok(resumed);
		assert.notEqual(resumed.rexSession, metadata.rexSession);
		const resumeLaunch = JSON.parse(readFileSync(join(runDir, "launch.json"), "utf8"));
		assert.ok(resumeLaunch.args.includes(metadata.sessionFile));
		assert.equal(
			resumeLaunch.args.some((arg: string) => arg.startsWith("Task:")),
			false,
		);
		const unavailableStop = spawnSync(process.execPath, [cli.pathname, "stop", handle], {
			encoding: "utf8",
			timeout: 10_000,
			env: { ...process.env, PI_CODING_AGENT_DIR: agentDir, REX_SERVER: "127.0.0.1:1" },
		});
		assert.equal(unavailableStop.status, 1);
		assert.ok(existsSync(join(runDir, "metadata.json")), "A control failure must retain the run");
		const stopped = invoke(["stop", handle], agentDir);
		assert.equal(stopped.status, 0, stopped.stderr);
		assert.equal(existsSync(runDir), false);
	} finally {
		const remaining = runDir ? readMetadata(runDir) : undefined;
		if (remaining) stopRun(remaining);
		rmSync(root, { recursive: true, force: true });
	}
});
