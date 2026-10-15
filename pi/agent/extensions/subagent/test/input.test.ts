import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
	InlineInputTooLargeError,
	MAX_FILE_REFERENCES,
	MAX_INLINE_INPUT_BYTES,
	TooManyFileReferencesError,
	prepareSubagentPrompt,
} from "../shared/input.ts";

async function withWorkspace(
	run: (paths: { readonly parent: string; readonly child: string }) => Promise<void>,
): Promise<void> {
	const parent = await mkdtemp(join(tmpdir(), "pi-subagent-input-"));
	const child = join(parent, ".worktrees", "feature");
	await mkdir(child, { recursive: true });
	try {
		await run({ parent, child });
	} finally {
		await rm(parent, { recursive: true, force: true });
	}
}

test("large file references remain lazy and do not embed contents", async () => {
	await withWorkspace(async ({ parent, child }) => {
		const sentinel = "must-not-enter-the-prompt";
		const largePath = join(child, "large.diff");
		const content = `${sentinel}\n${"x".repeat(150 * 1024)}`;
		await writeFile(largePath, content);

		const prepared = await prepareSubagentPrompt(
			{ task: "Review the change", files: [{ path: "large.diff" }] },
			{ parentCwd: parent, childCwd: child },
		);

		assert.equal(prepared.fileReferences[0]?.status, "available");
		assert.equal(prepared.fileReferences[0]?.sizeBytes, Buffer.byteLength(content));
		assert.equal(prepared.prompt.includes(sentinel), false);
		assert.match(prepared.prompt, /File contents are not embedded/);
	});
});

test("file references resolve against explicit child and parent roots", async () => {
	await withWorkspace(async ({ parent, child }) => {
		await mkdir(join(parent, ".pi", "todos"), { recursive: true });
		await mkdir(join(child, "src"), { recursive: true });
		await writeFile(join(parent, ".pi", "todos", "task.md"), "todo");
		await writeFile(join(child, "src", "main.ts"), "export {};");

		const prepared = await prepareSubagentPrompt(
			{
				task: "Inspect inputs",
				files: [
					{ path: "src/main.ts" },
					{ path: ".pi/todos/task.md", relativeTo: "parent" },
				],
			},
			{ parentCwd: parent, childCwd: child },
		);

		assert.equal(prepared.fileReferences[0]?.readPath, join(child, "src", "main.ts"));
		assert.equal(prepared.fileReferences[1]?.readPath, join(parent, ".pi", "todos", "task.md"));
		assert.deepEqual(
			prepared.fileReferences.map((file) => file.status),
			["available", "available"],
		);
	});
});

test("missing references are reported without rejecting prompt preparation", async () => {
	await withWorkspace(async ({ parent, child }) => {
		const prepared = await prepareSubagentPrompt(
			{ task: "Inspect input", files: [{ path: "missing.ts" }] },
			{ parentCwd: parent, childCwd: child },
		);

		assert.equal(prepared.fileReferences[0]?.status, "unavailable");
		assert.equal(prepared.fileReferences[0]?.errorCode, "ENOENT");
		assert.match(prepared.prompt, /Do not claim to have inspected an unavailable file/);
	});
});

test("leading at signs are normalized like built-in path tools", async () => {
	await withWorkspace(async ({ parent, child }) => {
		await writeFile(join(child, "file.ts"), "export {};");
		const prepared = await prepareSubagentPrompt(
			{ task: "Inspect input", files: [{ path: "@file.ts" }] },
			{ parentCwd: parent, childCwd: child },
		);

		assert.equal(prepared.fileReferences[0]?.requestedPath, "file.ts");
		assert.equal(prepared.fileReferences[0]?.status, "available");
	});
});

test("inline input budget counts UTF-8 bytes and never truncates", async () => {
	await assert.rejects(
		prepareSubagentPrompt(
			{ task: "é".repeat(MAX_INLINE_INPUT_BYTES) },
			{ parentCwd: "/parent", childCwd: "/child" },
		),
		(error: unknown) => {
			assert.ok(error instanceof InlineInputTooLargeError);
			assert.equal(error.actualBytes, MAX_INLINE_INPUT_BYTES * 2);
			return true;
		},
	);
});

test("file reference count is bounded", async () => {
	const files = Array.from({ length: MAX_FILE_REFERENCES + 1 }, (_, index) => ({
		path: `file-${index}.ts`,
	}));
	await assert.rejects(
		prepareSubagentPrompt(
			{ task: "Inspect inputs", files },
			{ parentCwd: "/parent", childCwd: "/child" },
		),
		(error: unknown) => {
			assert.ok(error instanceof TooManyFileReferencesError);
			assert.equal(error.actualCount, MAX_FILE_REFERENCES + 1);
			return true;
		},
	);
});

test("manifest escapes unusual file names instead of interpreting markup", async () => {
	await withWorkspace(async ({ parent, child }) => {
		const unusual = "quoted-\"-line\n-break.md";
		const prepared = await prepareSubagentPrompt(
			{ task: "Inspect input", files: [{ path: unusual }] },
			{ parentCwd: parent, childCwd: child },
		);

		assert.match(prepared.prompt, /quoted-\\"-line\\n-break\.md/);
		assert.equal(prepared.fileReferences[0]?.requestedPath, unusual);
	});
});
