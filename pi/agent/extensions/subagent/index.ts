import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadAgentDefinitions } from "./shared/agents.ts";
import registerLibrarian from "./tools/librarian.ts";
import registerOracle from "./tools/oracle.ts";
import registerReviewer from "./tools/reviewer.ts";
import registerSearch from "./tools/search.ts";
import registerWorker from "./tools/worker.ts";

export default function subagentExtension(pi: ExtensionAPI) {
	const agents = loadAgentDefinitions();
	registerOracle(pi, getRequiredAgent(agents, "oracle"));
	registerSearch(pi, getRequiredAgent(agents, "search"));
	registerLibrarian(pi, getRequiredAgent(agents, "librarian"));
	registerWorker(pi, getRequiredAgent(agents, "worker"));
	registerReviewer(pi, getRequiredAgent(agents, "reviewer"));
}

function getRequiredAgent(
	agents: ReturnType<typeof loadAgentDefinitions>,
	name: "oracle" | "search" | "librarian" | "worker" | "reviewer",
) {
	const agent = agents.get(name);
	if (!agent) throw new Error(`Missing required subagent definition: ${name}`);
	return agent;
}
