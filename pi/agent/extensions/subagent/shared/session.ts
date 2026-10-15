import { realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import type { AgentToolResult, AgentToolUpdateCallback } from "@earendil-works/pi-agent-core";
import type { AssistantMessage, Usage } from "@earendil-works/pi-ai";
import {
	DEFAULT_MAX_BYTES,
	DEFAULT_MAX_LINES,
	DefaultResourceLoader,
	getAgentDir,
	ModelRuntime,
	SessionManager,
	SettingsManager,
	createAgentSession,
	truncateHead,
	type ExtensionContext,
	type ModelRegistry,
} from "@earendil-works/pi-coding-agent";
import { loadAgentDefinition, type AgentDefinition } from "./agents.ts";
import {
	prepareSubagentPrompt,
	type FileReferenceInput,
	type FileReferenceStatus,
} from "./input.ts";

const SUBAGENT_TIMEOUT_MS = 600_000;
const SUBAGENT_SESSION_DIR_NAME = "subagents";

/** Stable outcome returned for every child run created successfully. */
export type SubagentOutcome =
	| "completed"
	| "stopped"
	| "model-error"
	| "cancelled"
	| "timeout"
	| "no-message"
	| "setup-error";

/** Textual projection of the last assistant message; the full message remains in the child session. */
export interface SubagentLastMessage {
	readonly role: "assistant";
	readonly text: string;
	readonly stopReason: AssistantMessage["stopReason"];
	readonly errorMessage?: string | undefined;
}

/** Metadata retained with a completed, stopped, or failed subagent result. */
export interface SubagentDetails {
	readonly agent: string;
	readonly model: string;
	readonly childSessionId: string;
	readonly childSessionFile: string;
	readonly parentSessionFile?: string | undefined;
	readonly parentLeafId?: string | undefined;
	readonly cwd: string;
	readonly outcome: SubagentOutcome | "running";
	readonly startedAt: string;
	readonly durationMs?: number | undefined;
	readonly inlineBytes: number;
	readonly fileReferences: readonly FileReferenceStatus[];
	readonly lastMessage?: SubagentLastMessage | undefined;
	readonly persistenceError?: string | undefined;
	readonly truncated: boolean;
}

/** Explicit context supplied to one isolated child session. */
export interface RunSubagentInput {
	readonly agent: AgentDefinition;
	readonly task: string;
	readonly context?: string | undefined;
	readonly files?: readonly FileReferenceInput[] | undefined;
	readonly cwd?: string | undefined;
}

/**
 * Run one isolated, blocking subagent and always return its persisted session reference.
 *
 * Child failures are modeled in `details.outcome` and parent-visible text rather
 * than thrown after session creation, allowing an orchestrator to inspect or
 * resume the child. Failures before a child session can be created still throw.
 */
export async function runSubagent(
	input: RunSubagentInput,
	ctx: ExtensionContext,
	signal?: AbortSignal,
	onUpdate?: AgentToolUpdateCallback<SubagentDetails>,
): Promise<AgentToolResult<SubagentDetails>> {
	const startedAtMs = Date.now();
	const startedAt = new Date(startedAtMs).toISOString();
	const cwd = await resolveChildCwd(ctx.cwd, input.cwd);
	const parentSessionFile = ctx.sessionManager.getSessionFile() ?? undefined;
	const parentLeafId = ctx.sessionManager.getLeafId() ?? undefined;
	const childSessionManager = SessionManager.create(
		cwd,
		join(getAgentDir(), "sessions", SUBAGENT_SESSION_DIR_NAME),
		parentSessionFile ? { parentSession: parentSessionFile } : undefined,
	);
	const childSessionFile = childSessionManager.getSessionFile();
	if (!childSessionFile) {
		throw new Error("Persisted subagent session did not provide a session file");
	}
	let details: SubagentDetails = {
		agent: input.agent.name,
		model: input.agent.model,
		childSessionId: childSessionManager.getSessionId(),
		childSessionFile,
		parentSessionFile,
		parentLeafId,
		cwd,
		outcome: "running",
		startedAt,
		inlineBytes: 0,
		fileReferences: [],
		truncated: false,
	};
	onUpdate?.({
		content: [{ type: "text", text: `${input.agent.name} is starting…` }],
		details,
	});

	let agent: AgentDefinition;
	let prompt: string;
	let modelRuntime: ModelRuntime;
	let model: ReturnType<typeof resolveExactModel>;
	try {
		childSessionManager.appendSessionInfo(`${input.agent.name}: ${summarizeTask(input.task)}`);
		const childProjectTrusted = await isChildProjectTrusted(
			ctx.cwd,
			cwd,
			ctx.isProjectTrusted(),
		);
		agent = loadAgentDefinition(input.agent.name, cwd, childProjectTrusted);
		const prepared = await prepareSubagentPrompt(input, {
			parentCwd: ctx.cwd,
			childCwd: cwd,
		});
		prompt = prepared.prompt;
		details = {
			...details,
			agent: agent.name,
			model: agent.model,
			inlineBytes: prepared.inlineBytes,
			fileReferences: prepared.fileReferences,
		};
		modelRuntime = await createChildModelRuntime(agent, ctx.modelRegistry);
		model = resolveExactModel(modelRuntime, agent.model);
	} catch (cause: unknown) {
		return finishWithoutAgent(childSessionManager, details, startedAtMs, cause);
	}

	const agentDir = getAgentDir();
	let settingsManager: SettingsManager;
	let resourceLoader: DefaultResourceLoader;
	try {
		const childProjectTrusted = await isChildProjectTrusted(
			ctx.cwd,
			cwd,
			ctx.isProjectTrusted(),
		);
		settingsManager = SettingsManager.create(cwd, agentDir, {
			projectTrusted: childProjectTrusted,
		});
		resourceLoader = new DefaultResourceLoader({
			cwd,
			agentDir,
			settingsManager,
			noExtensions: true,
			noSkills: true,
			noPromptTemplates: true,
			noThemes: true,
			noContextFiles: true,
			systemPrompt: agent.systemPrompt,
		});
		await resourceLoader.reload();
	} catch (cause: unknown) {
		return finishWithoutAgent(childSessionManager, details, startedAtMs, cause);
	}

	let session: Awaited<ReturnType<typeof createAgentSession>>["session"];
	try {
		({ session } = await createAgentSession({
			cwd,
			agentDir,
			modelRuntime,
			model,
			thinkingLevel: agent.thinkingLevel,
			tools: [...agent.tools],
			customTools: [...agent.customTools],
			resourceLoader,
			sessionManager: childSessionManager,
			settingsManager,
		}));
	} catch (cause: unknown) {
		return finishWithoutAgent(childSessionManager, details, startedAtMs, cause);
	}

	details = { ...details, model: `${model.provider}/${model.id}` };
	onUpdate?.({
		content: [
			{
				type: "text",
				text: `${agent.name} is running… Session ${details.childSessionId}`,
			},
		],
		details,
	});

	const timeoutController = new AbortController();
	const timeoutId = setTimeout(
		() => timeoutController.abort(new Error(`Subagent timed out after ${SUBAGENT_TIMEOUT_MS / 1000} seconds`)),
		SUBAGENT_TIMEOUT_MS,
	);
	const effectiveSignal = signal
		? AbortSignal.any([signal, timeoutController.signal])
		: timeoutController.signal;
	let abortPromise: Promise<void> | undefined;
	let abortErrorMessage: string | undefined;
	const abortChild = () => {
		abortPromise ??= session.abort().catch((cause: unknown) => {
			abortErrorMessage = `Child abort failed: ${getCauseMessage(cause)}`;
		});
	};
	effectiveSignal.addEventListener("abort", abortChild, { once: true });
	if (effectiveSignal.aborted) {
		abortChild();
		if (abortPromise) await abortPromise;
		const result = finishAgentRun({
			sessionManager: childSessionManager,
			messages: session.messages,
			details,
			startedAtMs,
			forcedOutcome: timeoutController.signal.aborted ? "timeout" : "cancelled",
			forcedErrorMessage: combineErrorMessages(
				getCauseMessage(effectiveSignal.reason),
				abortErrorMessage,
			),
		});
		clearTimeout(timeoutId);
		effectiveSignal.removeEventListener("abort", abortChild);
		safelyDisposeSession(session, childSessionManager);
		return result;
	}

	try {
		await session.prompt(prompt);
		if (abortPromise) await abortPromise;
		return finishAgentRun({
			sessionManager: childSessionManager,
			messages: session.messages,
			details,
			startedAtMs,
			forcedOutcome: effectiveSignal.aborted
				? timeoutController.signal.aborted
					? "timeout"
					: "cancelled"
				: undefined,
			forcedErrorMessage: effectiveSignal.aborted
				? combineErrorMessages(
						getCauseMessage(effectiveSignal.reason),
						abortErrorMessage,
					)
				: undefined,
		});
	} catch (cause: unknown) {
		if (abortPromise) await abortPromise;
		return finishAgentRun({
			sessionManager: childSessionManager,
			messages: session.messages,
			details,
			startedAtMs,
			forcedOutcome: timeoutController.signal.aborted
				? "timeout"
				: signal?.aborted
					? "cancelled"
					: "model-error",
			forcedErrorMessage: combineErrorMessages(getCauseMessage(cause), abortErrorMessage),
		});
	} finally {
		clearTimeout(timeoutId);
		effectiveSignal.removeEventListener("abort", abortChild);
		if (abortPromise) await abortPromise;
		safelyDisposeSession(session, childSessionManager);
	}
}

async function createChildModelRuntime(
	agent: AgentDefinition,
	parentRegistry: ModelRegistry,
): Promise<ModelRuntime> {
	const [providerId] = splitExactModel(agent.model);
	const agentDir = getAgentDir();
	const runtime = await ModelRuntime.create({
		authPath: join(agentDir, "auth.json"),
		modelsPath: join(agentDir, "models.json"),
		allowModelNetwork: false,
	});

	const nativeProvider = parentRegistry.getRegisteredNativeProvider(providerId);
	const providerConfig = parentRegistry.getRegisteredProviderConfig(providerId);
	if (nativeProvider) {
		runtime.registerNativeProvider(nativeProvider);
	} else if (providerConfig) {
		runtime.registerProvider(providerId, providerConfig);
	}
	await runtime.refresh({ allowNetwork: false });
	return runtime;
}

function resolveExactModel(runtime: ModelRuntime, configuredModel: string) {
	const [providerId, modelId] = splitExactModel(configuredModel);
	const model = runtime.getModel(providerId, modelId);
	if (!model) {
		throw new Error(`Configured subagent model is unavailable: ${configuredModel}`);
	}
	return model;
}

function splitExactModel(configuredModel: string): readonly [string, string] {
	const separator = configuredModel.indexOf("/");
	if (separator <= 0 || separator === configuredModel.length - 1) {
		throw new Error(`Expected an exact provider/model, received: ${configuredModel}`);
	}
	return [configuredModel.slice(0, separator), configuredModel.slice(separator + 1)];
}

async function resolveChildCwd(parentCwd: string, requestedCwd?: string): Promise<string> {
	const cwd = requestedCwd
		? isAbsolute(requestedCwd)
			? resolve(requestedCwd)
			: resolve(parentCwd, requestedCwd)
		: parentCwd;
	let info;
	try {
		info = await stat(cwd);
	} catch (cause: unknown) {
		throw new Error(`Subagent working directory does not exist: ${cwd}`, { cause });
	}
	if (!info.isDirectory()) {
		throw new Error(`Subagent working directory is not a directory: ${cwd}`);
	}
	try {
		return await realpath(cwd);
	} catch (cause: unknown) {
		throw new Error(`Unable to resolve subagent working directory: ${cwd}`, { cause });
	}
}

async function isChildProjectTrusted(
	parentCwd: string,
	childCwd: string,
	parentProjectTrusted: boolean,
): Promise<boolean> {
	if (!parentProjectTrusted) return false;
	try {
		const [trustedRoot, candidate] = await Promise.all([
			realpath(parentCwd),
			realpath(childCwd),
		]);
		const relativePath = relative(trustedRoot, candidate);
		return (
			relativePath === "" ||
			(relativePath !== ".." &&
				!relativePath.startsWith(`..${sep}`) &&
				!isAbsolute(relativePath))
		);
	} catch {
		return false;
	}
}

function createSetupFailureMessage(
	details: SubagentDetails,
	errorMessage: string,
): AssistantMessage {
	const separator = details.model.indexOf("/");
	const provider = separator > 0 ? details.model.slice(0, separator) : "subagent";
	const model = separator > 0 ? details.model.slice(separator + 1) : details.model;
	return {
		role: "assistant",
		content: [
			{
				type: "text",
				text: `Subagent setup failed before model execution: ${errorMessage}`,
			},
		],
		api: "openai-responses",
		provider,
		model,
		usage: emptyUsage(),
		stopReason: "error",
		errorMessage,
		timestamp: Date.now(),
	};
}

function finishWithoutAgent(
	sessionManager: SessionManager,
	details: SubagentDetails,
	startedAtMs: number,
	cause: unknown,
): AgentToolResult<SubagentDetails> {
	const errorMessage = getCauseMessage(cause);
	const setupMessage = createSetupFailureMessage(details, errorMessage);
	let setupPersistenceError: string | undefined;
	try {
		sessionManager.appendMessage(setupMessage);
	} catch (appendCause: unknown) {
		setupPersistenceError = getCauseMessage(appendCause);
	}
	const projectedSetupMessage = projectAssistantMessage(setupMessage);
	let finished: SubagentDetails = {
		...details,
		outcome: "setup-error",
		durationMs: Date.now() - startedAtMs,
		lastMessage: projectedSetupMessage.lastMessage,
		truncated: projectedSetupMessage.truncated,
	};
	const outcomePersistenceError = persistRunOutcome(sessionManager, finished, errorMessage);
	const persistenceError = combineOptionalErrorMessages(
		setupPersistenceError,
		outcomePersistenceError,
	);
	finished = {
		...finished,
		persistenceError,
	};
	return {
		content: [
			{
				type: "text",
				text: formatParentResult(
					finished,
					projectedSetupMessage.lastMessage.text,
					errorMessage,
				),
			},
		],
		details: finished,
		usage: emptyUsage(),
	};
}

function finishAgentRun(input: {
	readonly sessionManager: SessionManager;
	readonly messages: readonly unknown[];
	readonly details: SubagentDetails;
	readonly startedAtMs: number;
	readonly forcedOutcome?: SubagentOutcome | undefined;
	readonly forcedErrorMessage?: string | undefined;
}): AgentToolResult<SubagentDetails> {
	const assistant = findLastAssistantMessage(input.messages);
	const projectedLastMessage = assistant ? projectAssistantMessage(assistant) : undefined;
	const lastMessage = projectedLastMessage?.lastMessage;
	const outcome = input.forcedOutcome ?? classifyAssistantOutcome(lastMessage);
	const outputAssistant = findLastAssistantMessageWithText(input.messages);
	const rawOutput = outputAssistant ? getAssistantText(outputAssistant) : "";
	const truncatedOutput = truncateHead(rawOutput, {
		maxBytes: DEFAULT_MAX_BYTES,
		maxLines: DEFAULT_MAX_LINES,
	});
	const output = truncatedOutput.truncated
		? `${truncatedOutput.content}\n\n[Subagent output truncated to ${DEFAULT_MAX_BYTES} bytes / ${DEFAULT_MAX_LINES} lines.]`
		: truncatedOutput.content;
	const errorMessage =
		input.forcedErrorMessage ?? lastMessage?.errorMessage ?? outcomeDefaultMessage(outcome);
	let finished: SubagentDetails = {
		...input.details,
		outcome,
		durationMs: Date.now() - input.startedAtMs,
		lastMessage,
		truncated: truncatedOutput.truncated || (projectedLastMessage?.truncated ?? false),
	};
	const persistenceError = persistRunOutcome(input.sessionManager, finished, errorMessage);
	finished = {
		...finished,
		persistenceError,
	};
	return {
		content: [{ type: "text", text: formatParentResult(finished, output, errorMessage) }],
		details: finished,
		usage: aggregateUsage(input.messages),
	};
}

function classifyAssistantOutcome(lastMessage: SubagentLastMessage | undefined): SubagentOutcome {
	if (!lastMessage) return "no-message";
	switch (lastMessage.stopReason) {
		case "stop":
			return lastMessage.text ? "completed" : "no-message";
		case "length":
		case "toolUse":
			return "stopped";
		case "error":
			return "model-error";
		case "aborted":
			return "cancelled";
		default:
			return "stopped";
	}
}

function projectAssistantMessage(message: AssistantMessage): {
	readonly lastMessage: SubagentLastMessage;
	readonly truncated: boolean;
} {
	const text = truncateHead(getAssistantText(message), {
		maxBytes: DEFAULT_MAX_BYTES,
		maxLines: DEFAULT_MAX_LINES,
	});
	return {
		lastMessage: {
			role: "assistant",
			text: text.content,
			stopReason: message.stopReason,
			errorMessage: message.errorMessage,
		},
		truncated: text.truncated,
	};
}

function formatParentResult(
	details: SubagentDetails,
	output: string,
	errorMessage?: string,
): string {
	const sessionReference = [
		`Subagent session: ${details.childSessionId}`,
		`Session file: ${details.childSessionFile}`,
	].join("\n");
	const persistenceWarning = details.persistenceError
		? `Session outcome metadata could not be appended: ${details.persistenceError}`
		: "";
	if (details.outcome === "completed") {
		return [output, persistenceWarning, sessionReference]
			.filter((part) => part.length > 0)
			.join("\n\n");
	}
	const diagnostic = errorMessage
		? `Subagent outcome: ${details.outcome}. ${errorMessage}`
		: `Subagent outcome: ${details.outcome}.`;
	return [diagnostic, output, persistenceWarning, sessionReference]
		.filter((part) => part.length > 0)
		.join("\n\n");
}

function outcomeDefaultMessage(outcome: SubagentOutcome): string | undefined {
	switch (outcome) {
		case "no-message":
			return "The child produced no final assistant text; inspect the persisted session.";
		case "stopped":
			return "The child stopped before a normal completion; inspect the persisted session.";
		case "model-error":
			return "The child model returned an error.";
		case "cancelled":
			return "The child was cancelled.";
		case "timeout":
			return `The child exceeded the ${SUBAGENT_TIMEOUT_MS / 1000}-second timeout.`;
		case "setup-error":
			return "The child could not be started.";
		case "completed":
			return undefined;
	}
}

function persistRunOutcome(
	sessionManager: SessionManager,
	details: SubagentDetails,
	errorMessage?: string,
): string | undefined {
	try {
		sessionManager.appendCustomEntry("subagent-run", {
			outcome: details.outcome,
			agent: details.agent,
			model: details.model,
			durationMs: details.durationMs,
			inlineBytes: details.inlineBytes,
			fileReferences: details.fileReferences,
			lastMessage: details.lastMessage,
			errorMessage,
			truncated: details.truncated,
		});
		return undefined;
	} catch (cause: unknown) {
		return getCauseMessage(cause);
	}
}

function findLastAssistantMessage(messages: readonly unknown[]): AssistantMessage | undefined {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (isAssistantMessage(message)) return message;
	}
	return undefined;
}

function findLastAssistantMessageWithText(messages: readonly unknown[]): AssistantMessage | undefined {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (isAssistantMessage(message) && getAssistantText(message)) return message;
	}
	return undefined;
}

function getAssistantText(message: AssistantMessage): string {
	return message.content
		.filter((part) => part.type === "text")
		.map((part) => part.text)
		.join("\n")
		.trim();
}

function isAssistantMessage(value: unknown): value is AssistantMessage {
	return typeof value === "object" && value !== null && "role" in value && value.role === "assistant";
}

function aggregateUsage(messages: readonly unknown[]): Usage {
	const total = emptyUsage();
	let reasoning: number | undefined;
	let cacheWrite1h: number | undefined;

	for (const message of messages) {
		if (!isAssistantMessage(message)) continue;
		const usage = message.usage;
		total.input += usage.input;
		total.output += usage.output;
		total.cacheRead += usage.cacheRead;
		total.cacheWrite += usage.cacheWrite;
		total.totalTokens += usage.totalTokens;
		total.cost.input += usage.cost.input;
		total.cost.output += usage.cost.output;
		total.cost.cacheRead += usage.cost.cacheRead;
		total.cost.cacheWrite += usage.cost.cacheWrite;
		total.cost.total += usage.cost.total;
		if (usage.reasoning !== undefined) reasoning = (reasoning ?? 0) + usage.reasoning;
		if (usage.cacheWrite1h !== undefined) cacheWrite1h = (cacheWrite1h ?? 0) + usage.cacheWrite1h;
	}

	return {
		...total,
		...(reasoning !== undefined ? { reasoning } : {}),
		...(cacheWrite1h !== undefined ? { cacheWrite1h } : {}),
	};
}

function emptyUsage(): Usage {
	return {
		input: 0,
		output: 0,
		cacheRead: 0,
		cacheWrite: 0,
		totalTokens: 0,
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
	};
}

function getCauseMessage(cause: unknown): string {
	if (cause instanceof Error) return cause.message;
	if (typeof cause === "string") return cause;
	if (
		typeof cause === "number" ||
		typeof cause === "boolean" ||
		typeof cause === "bigint"
	) {
		return String(cause);
	}
	return "Subagent failed with a non-Error cause";
}

function combineOptionalErrorMessages(
	first?: string,
	second?: string,
): string | undefined {
	if (first && second) return `${first} ${second}`;
	return first ?? second;
}

function combineErrorMessages(
	primary: string,
	secondary?: string,
): string {
	return secondary ? `${primary} ${secondary}` : primary;
}

function safelyDisposeSession(
	session: Awaited<ReturnType<typeof createAgentSession>>["session"],
	sessionManager: SessionManager,
): void {
	try {
		session.dispose();
	} catch (cause: unknown) {
		try {
			sessionManager.appendCustomEntry("subagent-dispose-error", {
				message: getCauseMessage(cause),
			});
		} catch {
			// The child session reference was already returned; disposal errors must not mask it.
		}
	}
}

function summarizeTask(task: string): string {
	const normalized = task.trim().replace(/\s+/g, " ");
	return normalized.length <= 80 ? normalized : `${normalized.slice(0, 77)}…`;
}
