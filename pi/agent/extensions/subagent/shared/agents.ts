import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
	CONFIG_DIR_NAME,
	getAgentDir,
	parseFrontmatter,
	type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { createWebFetchTool } from "../../web-tools/webfetch.ts";

export const AGENT_NAMES = ["oracle", "search", "librarian", "worker", "reviewer"] as const;
/** Name of a blocking subagent exposed by this extension. */
export type AgentName = (typeof AGENT_NAMES)[number];

/** Pi thinking level accepted in agent definition frontmatter. */
export type AgentThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

/** Validated agent definition and its effective capability policy. */
export interface AgentDefinition {
	readonly name: AgentName;
	readonly description: string;
	readonly model: string;
	readonly thinkingLevel: AgentThinkingLevel;
	readonly tools: readonly string[];
	readonly customTools: readonly ToolDefinition[];
	readonly systemPrompt: string;
	readonly filePath: string;
}

const ROLE_TOOL_POLICIES: Readonly<Record<AgentName, ReadonlySet<string>>> = {
	oracle: new Set(["read", "grep", "find", "ls", "bash"]),
	search: new Set(["read", "grep", "find", "ls"]),
	librarian: new Set(["read", "grep", "find", "ls", "webfetch"]),
	worker: new Set(["read", "grep", "find", "ls", "bash", "write", "edit"]),
	reviewer: new Set(["read", "grep", "find", "ls"]),
};

const CUSTOM_TOOLS: Readonly<Partial<Record<AgentName, readonly ToolDefinition[]>>> = {
	librarian: [createWebFetchTool()],
};

/** Load and validate the global fallback definitions used during tool registration. */
export function loadAgentDefinitions(): ReadonlyMap<AgentName, AgentDefinition> {
	const definitions = new Map<AgentName, AgentDefinition>();
	for (const expectedName of AGENT_NAMES) {
		definitions.set(expectedName, loadAgentDefinition(expectedName));
	}
	return definitions;
}

/** Resolve the nearest workspace agent override, falling back to the global definition. */
export function loadAgentDefinition(
	expectedName: AgentName,
	cwd?: string,
	projectTrusted = false,
): AgentDefinition {
	const projectFile = projectTrusted ? findProjectAgentFile(expectedName, cwd) : undefined;
	const filePath = projectFile ?? join(getAgentDir(), "agents", `${expectedName}.md`);
	let content: string;
	try {
		content = readFileSync(filePath, "utf8");
	} catch (cause: unknown) {
		throw new Error(`Failed to read subagent definition: ${filePath}`, { cause });
	}

	const { frontmatter, body } = parseFrontmatter<Record<string, string>>(content);
	if (frontmatter.name !== expectedName) {
		throw new Error(`Agent definition ${filePath} must declare name: ${expectedName}`);
	}
	if (!frontmatter.description?.trim()) {
		throw new Error(`Agent definition ${filePath} must declare a description`);
	}
	if (!frontmatter.model?.includes("/")) {
		throw new Error(`Agent definition ${filePath} must declare an exact provider/model`);
	}
	if (!body.trim()) {
		throw new Error(`Agent definition ${filePath} must include a system prompt`);
	}

	const thinkingLevel = frontmatter.thinking ?? "medium";
	if (!isAgentThinkingLevel(thinkingLevel)) {
		throw new Error(`Agent definition ${filePath} has invalid thinking level: ${thinkingLevel}`);
	}

	const requestedTools = (frontmatter.tools ?? "")
		.split(",")
		.map((tool) => tool.trim())
		.filter((tool) => tool.length > 0);
	const allowedTools = ROLE_TOOL_POLICIES[expectedName];
	const tools = requestedTools.filter((tool) => allowedTools.has(tool));
	if (tools.length === 0) {
		throw new Error(`Agent definition ${filePath} has no tools allowed by its role policy`);
	}

	return {
		name: expectedName,
		description: frontmatter.description.trim(),
		model: frontmatter.model.trim(),
		thinkingLevel,
		tools,
		customTools: CUSTOM_TOOLS[expectedName] ?? [],
		systemPrompt: body.trim(),
		filePath,
	};
}

function findProjectAgentFile(name: AgentName, cwd: string | undefined): string | undefined {
	if (!cwd) return undefined;
	let directory = cwd;
	while (true) {
		const candidate = join(directory, CONFIG_DIR_NAME, "agents", `${name}.md`);
		if (existsSync(candidate)) return candidate;
		const parent = dirname(directory);
		if (parent === directory) return undefined;
		directory = parent;
	}
}

function isAgentThinkingLevel(value: string): value is AgentThinkingLevel {
	switch (value) {
		case "off":
		case "minimal":
		case "low":
		case "medium":
		case "high":
		case "xhigh":
		case "max":
			return true;
		default:
			return false;
	}
}
