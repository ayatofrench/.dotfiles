import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
	CONFIG_DIR_NAME,
	getAgentDir,
	parseFrontmatter,
} from "@earendil-works/pi-coding-agent";

export type PainterBackend = "auto" | "pi" | "codex";

/** Validated Painter configuration resolved for one workspace. */
export interface PainterConfig {
	readonly backend: PainterBackend;
	readonly description: string;
	readonly model?: string | undefined;
	readonly instructions: string;
	readonly filePath: string;
}

/** Load the nearest trusted workspace Painter override, falling back to the global definition. */
export function loadPainterConfig(cwd: string, projectTrusted: boolean): PainterConfig {
	const projectFile = projectTrusted ? findProjectConfig(cwd) : undefined;
	const filePath = projectFile ?? join(getAgentDir(), "agents", "painter.md");
	let content: string;
	try {
		content = readFileSync(filePath, "utf8");
	} catch (cause: unknown) {
		throw new Error(`Failed to read Painter configuration: ${filePath}`, { cause });
	}

	const { frontmatter, body } = parseFrontmatter<Record<string, string>>(content);
	if (frontmatter.name !== "painter") {
		throw new Error(`Painter configuration ${filePath} must declare name: painter`);
	}
	if (!frontmatter.description?.trim()) {
		throw new Error(`Painter configuration ${filePath} must declare a description`);
	}
	if (!isPainterBackend(frontmatter.backend)) {
		throw new Error(`Painter configuration ${filePath} has invalid backend: ${frontmatter.backend ?? "missing"}`);
	}

	const model = frontmatter.model?.trim();
	if (frontmatter.backend !== "codex" && !model?.includes("/")) {
		throw new Error(`Painter configuration ${filePath} must declare an exact provider/model`);
	}

	return {
		backend: frontmatter.backend,
		description: frontmatter.description.trim(),
		model,
		instructions: body.trim(),
		filePath,
	};
}

function findProjectConfig(cwd: string): string | undefined {
	let directory = cwd;
	while (true) {
		const candidate = join(directory, CONFIG_DIR_NAME, "agents", "painter.md");
		if (existsSync(candidate)) return candidate;
		const parent = dirname(directory);
		if (parent === directory) return undefined;
		directory = parent;
	}
}

function isPainterBackend(value: string | undefined): value is PainterBackend {
	return value === "auto" || value === "pi" || value === "codex";
}
