import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
	type Api,
	type AssistantMessage,
	type AssistantMessageEventStream,
	createAssistantMessageEventStream,
	type Context,
	getModels,
	type Model,
	streamSimpleAnthropic,
	streamSimpleOpenAIResponses,
	type SimpleStreamOptions,
} from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const execFileAsync = promisify(execFile);

const AZURE_PROVIDER_NAME = "azure-ai-foundry";
const ANTHROPIC_PROVIDER_NAME = "anthropic-foundry";

const CUSTOM_AZURE_API = "azure-ai-foundry-api" as Api;
const CUSTOM_ANTHROPIC_API = "anthropic-foundry-api" as Api;

const DEFAULT_BASE_URL_PLACEHOLDER = "https://placeholder.invalid";
const DEFAULT_AZ_CLI_RESOURCE = "https://cognitiveservices.azure.com";
const OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH = 64;
const GPT_56_MODEL_IDS = new Set(["gpt-5.6-luna", "gpt-5.6-sol", "gpt-5.6-terra"]);

/** Derive the Azure AD resource scope from the base URL pattern. */
function deriveAzureResourceScope(baseUrl: string): string {
	const url = baseUrl.toLowerCase();
	// Microsoft Foundry service endpoints use the ai.azure.com scope.
	// Azure OpenAI-compatible endpoints (*.openai.azure.com and legacy
	// *.cognitiveservices.azure.com/openai) expect a Cognitive Services token.
	if (url.includes(".services.ai.azure.com")) return "https://ai.azure.com/.default";
	if (url.includes(".openai.azure.com")) return "https://cognitiveservices.azure.com/.default";
	if (url.includes(".cognitiveservices.azure.com")) return "https://cognitiveservices.azure.com/.default";
	return DEFAULT_AZ_CLI_RESOURCE;
}

// Azure OpenAI-style Foundry envs
const AZURE_API_KEY_ENV_NAMES = [
	"AZURE_AI_FOUNDRY_API_KEY",
	"AZURE_API_KEY",
	"AZURE_COGNITIVE_SERVICES_API_KEY",
	"AZURE_OPENAI_API_KEY",
] as const;
const AZURE_AUTH_TOKEN_ENV_NAMES = ["AZURE_AI_FOUNDRY_AUTH_TOKEN", "AZURE_OPENAI_AUTH_TOKEN"] as const;
const AZURE_BASE_URL_ENV_NAMES = ["AZURE_AI_FOUNDRY_BASE_URL", "AZURE_OPENAI_BASE_URL"] as const;
const AZURE_RESOURCE_NAME_ENV_NAMES = [
	"AZURE_AI_FOUNDRY_RESOURCE_NAME",
	"AZURE_RESOURCE_NAME",
	"AZURE_COGNITIVE_SERVICES_RESOURCE_NAME",
	"AZURE_OPENAI_RESOURCE_NAME",
] as const;
const AZURE_DEPLOYMENT_MAP_ENV_NAMES = [
	"AZURE_AI_FOUNDRY_DEPLOYMENT_NAME_MAP",
	"AZURE_OPENAI_DEPLOYMENT_NAME_MAP",
] as const;
const AZ_CLI_ENABLE_ENV_NAMES = ["AZURE_AI_FOUNDRY_USE_AZ_CLI", "AZURE_OPENAI_USE_AZ_CLI"] as const;
const AZ_CLI_RESOURCE_ENV_NAMES = ["AZURE_AI_FOUNDRY_AZ_CLI_RESOURCE", "AZURE_OPENAI_AZ_CLI_RESOURCE"] as const;

// Anthropic Foundry envs
const ANTHROPIC_FOUNDRY_API_KEY_ENV_NAMES = [
	"ANTHROPIC_FOUNDRY_API_KEY",
	"ANTHROPIC_API_KEY",
	"AZURE_AI_FOUNDRY_API_KEY",
	"AZURE_API_KEY",
	"AZURE_COGNITIVE_SERVICES_API_KEY",
] as const;
const ANTHROPIC_FOUNDRY_AUTH_TOKEN_ENV_NAMES = [
	"ANTHROPIC_FOUNDRY_AUTH_TOKEN",
	...AZURE_AUTH_TOKEN_ENV_NAMES,
] as const;
const ANTHROPIC_FOUNDRY_BASE_URL_ENV_NAMES = ["ANTHROPIC_FOUNDRY_BASE_URL", "ANTHROPIC_BASE_URL"] as const;
const ANTHROPIC_FOUNDRY_DEPLOYMENT_MAP_ENV_NAMES = ["ANTHROPIC_FOUNDRY_DEPLOYMENT_NAME_MAP"] as const;
const ANTHROPIC_DEFAULT_SONNET_MODEL_ENV_NAMES = ["ANTHROPIC_DEFAULT_SONNET_MODEL"] as const;
const ANTHROPIC_DEFAULT_HAIKU_MODEL_ENV_NAMES = ["ANTHROPIC_DEFAULT_HAIKU_MODEL"] as const;
const ANTHROPIC_DEFAULT_OPUS_MODEL_ENV_NAMES = ["ANTHROPIC_DEFAULT_OPUS_MODEL"] as const;
const ANTHROPIC_DEFAULT_FABLE_MODEL_ENV_NAMES = ["ANTHROPIC_DEFAULT_FABLE_MODEL"] as const;
const ANTHROPIC_FOUNDRY_USE_AZ_CLI_ENV_NAMES = ["ANTHROPIC_FOUNDRY_USE_AZ_CLI", ...AZ_CLI_ENABLE_ENV_NAMES] as const;
const ANTHROPIC_FOUNDRY_AZ_CLI_RESOURCE_ENV_NAMES = [
	"ANTHROPIC_FOUNDRY_AZ_CLI_RESOURCE",
	...AZ_CLI_RESOURCE_ENV_NAMES,
] as const;

const AUTH_PLACEHOLDER = "<authenticated>";

const CLAUDE_SONNET_5_FOUNDRY_MODEL = {
	id: "claude-sonnet-5",
	name: "Claude Sonnet 5",
	reasoning: true,
	input: ["text", "image"],
	cost: {
		input: 2,
		output: 10,
		cacheRead: 0.2,
		cacheWrite: 2.5,
	},
	contextWindow: 1_000_000,
	maxTokens: 128_000,
	compat: { forceAdaptiveThinking: true },
};

const CLAUDE_FABLE_5_FOUNDRY_MODEL = {
	id: "claude-fable-5",
	name: "Claude Fable 5",
	reasoning: true,
	thinkingLevelMap: { off: null, xhigh: "xhigh" },
	input: ["text", "image"],
	cost: {
		input: 10,
		output: 50,
		cacheRead: 1,
		cacheWrite: 12.5,
	},
	contextWindow: 1_000_000,
	maxTokens: 128_000,
	compat: { forceAdaptiveThinking: true },
};

const API_KEY_PLACEHOLDERS = new Set<string>([
	...AZURE_API_KEY_ENV_NAMES,
	...AZURE_AUTH_TOKEN_ENV_NAMES,
	...ANTHROPIC_FOUNDRY_API_KEY_ENV_NAMES,
	...ANTHROPIC_FOUNDRY_AUTH_TOKEN_ENV_NAMES,
	AUTH_PLACEHOLDER,
]);

interface AzCliTokenCacheEntry {
	token: string;
	expiresAt: number;
}

const azCliTokenCache = new Map<string, AzCliTokenCacheEntry>();

function firstEnvValue(names: readonly string[]): string | undefined {
	for (const name of names) {
		const value = process.env[name]?.trim();
		if (value) return value;
	}
	return undefined;
}

function parseBool(value: string | undefined): boolean {
	if (!value) return false;
	switch (value.trim().toLowerCase()) {
		case "1":
		case "true":
		case "yes":
		case "on":
			return true;
		default:
			return false;
	}
}

function shouldUseAzCli(useAzCliEnvNames: readonly string[]): boolean {
	const configuredValues = useAzCliEnvNames
		.map((name) => process.env[name])
		.filter((value): value is string => value !== undefined);

	if (configuredValues.length === 0) {
		// Foundry default: use Azure CLI token flow unless explicitly disabled.
		return true;
	}

	return configuredValues.some((value) => parseBool(value));
}

function normalizeAzureBaseUrl(value: string): string {
	const trimmed = value.trim().replace(/\/+$/, "");
	if (/\/openai\/v\d+(?:\.\d+)?$/i.test(trimmed)) return trimmed;
	if (trimmed.endsWith("/openai/v1")) return trimmed;
	return `${trimmed}/openai/v1`;
}

function normalizeAnthropicBaseUrl(value: string): string {
	const trimmed = value.trim().replace(/\/+$/, "");
	// Anthropic SDK appends /v1/messages. For Azure AI Foundry Anthropic,
	// the base URL should be https://<resource>.services.ai.azure.com/anthropic.
	const withoutVersion = trimmed.replace(/\/anthropic\/v\d+(?:\.\d+)?$/i, "/anthropic");
	if (/\/anthropic$/i.test(withoutVersion)) return withoutVersion;

	try {
		const url = new URL(withoutVersion);
		if (url.hostname.toLowerCase().endsWith(".services.ai.azure.com")) {
			return `${withoutVersion}/anthropic`;
		}
	} catch {
		// Fall through and return the trimmed value for custom/proxy URLs.
	}

	return withoutVersion;
}

function parseDeploymentNameMap(value: string | undefined): Map<string, string> {
	const map = new Map<string, string>();
	if (!value) return map;
	for (const entry of value.split(",")) {
		const [rawModelId, rawDeploymentName] = entry.split("=", 2);
		const modelId = rawModelId?.trim();
		const deploymentName = rawDeploymentName?.trim();
		if (modelId && deploymentName) map.set(modelId, deploymentName);
	}
	return map;
}

function parseExpiresAt(raw: unknown): number {
	if (typeof raw !== "string" || !raw.trim()) return Date.now() + 45 * 60 * 1000;
	const normalized = raw.replace(" ", "T");
	const direct = Date.parse(normalized);
	if (!Number.isNaN(direct)) return direct;
	const fallback = Date.parse(raw);
	return Number.isNaN(fallback) ? Date.now() + 45 * 60 * 1000 : fallback;
}

async function fetchAzCliAccessToken(resource: string, subscription: string | undefined): Promise<string> {
	const cacheKey = subscription ? `${resource}\0${subscription}` : resource;
	const cached = azCliTokenCache.get(cacheKey);
	if (cached && cached.expiresAt - 60_000 > Date.now()) {
		return cached.token;
	}

	const scopeOrResourceFlag = resource.endsWith("/.default") ? "--scope" : "--resource";
	const args = [
		"account",
		"get-access-token",
		scopeOrResourceFlag,
		resource,
		...(subscription ? ["--subscription", subscription] : []),
		"--output",
		"json",
		"--query",
		"{accessToken:accessToken,expiresOn:expiresOn}",
	];
	const { stdout, stderr } = await execFileAsync("az", args, {
		timeout: 15_000,
		maxBuffer: 2 * 1024 * 1024,
	});
	const text = stdout?.trim();
	if (!text) {
		throw new Error(`Azure CLI returned empty token response${stderr?.trim() ? `: ${stderr.trim()}` : ""}`);
	}

	let parsed: { accessToken?: string; expiresOn?: string };
	try {
		parsed = JSON.parse(text) as { accessToken?: string; expiresOn?: string };
	} catch {
		throw new Error("Failed to parse Azure CLI token response as JSON");
	}

	const accessToken = parsed.accessToken?.trim();
	if (!accessToken) {
		throw new Error("Azure CLI token response did not include accessToken");
	}

	const expiresAt = parseExpiresAt(parsed.expiresOn);
	azCliTokenCache.set(cacheKey, { token: accessToken, expiresAt });
	return accessToken;
}

type ResolvedAuth =
	| { mode: "api-key"; value: string }
	| { mode: "bearer-token"; value: string }
	| { mode: "az-cli"; value: string; resource: string };

interface AzureResourceSubscriptionPair {
	resourceName: string;
	subscription?: string;
}

function toModelEnvSuffix(modelId: string): string {
	return modelId.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseResourceSubscriptionPair(value: string | undefined): AzureResourceSubscriptionPair | undefined {
	if (!value) return undefined;
	const [rawResourceName, rawSubscription] = value.split(/[,|]/, 2);
	const resourceName = rawResourceName?.trim();
	const subscription = rawSubscription?.trim();
	if (!resourceName) return undefined;
	return { resourceName, subscription: subscription || undefined };
}

function getAzureResourceSubscriptionPair(modelId: string): AzureResourceSubscriptionPair | undefined {
	const suffix = toModelEnvSuffix(modelId);
	return (
		parseResourceSubscriptionPair(process.env[`AZURE_OPENAI_RESOURCE_SUBSCRIPTION_${suffix}`]) ??
		parseResourceSubscriptionPair(process.env[`AZURE_AI_FOUNDRY_RESOURCE_SUBSCRIPTION_${suffix}`]) ??
		parseResourceSubscriptionPair(process.env.AZURE_OPENAI_RESOURCE_SUBSCRIPTION) ??
		parseResourceSubscriptionPair(process.env.AZURE_AI_FOUNDRY_RESOURCE_SUBSCRIPTION)
	);
}

function normalizeAzureResourceName(value: string): string {
	const trimmed = value.trim();
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	const resourceIdMatch = trimmed.match(
		/(?:^|\/)providers\/Microsoft\.(?:CognitiveServices|MachineLearningServices)\/(?:accounts|workspaces)\/([^/]+)/i,
	);
	if (resourceIdMatch?.[1]) return resourceIdMatch[1];
	if (trimmed.includes("/")) return trimmed.split("/").filter(Boolean).pop() ?? trimmed;
	return trimmed;
}

function buildAzureOpenAIBaseUrlFromResource(resourceName: string): string {
	const normalized = normalizeAzureResourceName(resourceName);
	if (/^https?:\/\//i.test(normalized)) return normalizeAzureBaseUrl(normalized);
	return normalizeAzureBaseUrl(`https://${normalized}.openai.azure.com/openai/v1`);
}

async function resolveAuth(options: {
	providerName: string;
	providedApiKey: string | undefined;
	apiKeyEnvNames: readonly string[];
	authTokenEnvNames: readonly string[];
	useAzCliEnvNames: readonly string[];
	azCliResourceEnvNames: readonly string[];
	/** Default Azure CLI resource scope, auto-derived from base URL when possible. */
	azCliDefaultResource?: string;
	azCliSubscription?: string;
}): Promise<ResolvedAuth> {
	const provided = options.providedApiKey?.trim();
	if (provided && !API_KEY_PLACEHOLDERS.has(provided)) {
		return { mode: "api-key", value: provided };
	}

	// A resource/subscription tuple is intended to select an Azure subscription
	// for token auth. Prefer Azure CLI here so a stale global AZURE_*_API_KEY
	// from another resource cannot silently override the per-model tuple.
	if (options.azCliSubscription && shouldUseAzCli(options.useAzCliEnvNames)) {
		const resource = firstEnvValue(options.azCliResourceEnvNames) ?? options.azCliDefaultResource ?? DEFAULT_AZ_CLI_RESOURCE;
		const value = await fetchAzCliAccessToken(resource, options.azCliSubscription);
		return { mode: "az-cli", value, resource };
	}

	const apiKey = firstEnvValue(options.apiKeyEnvNames);
	if (apiKey) return { mode: "api-key", value: apiKey };

	const token = firstEnvValue(options.authTokenEnvNames);
	if (token) return { mode: "bearer-token", value: token };

	if (shouldUseAzCli(options.useAzCliEnvNames)) {
		const resource = firstEnvValue(options.azCliResourceEnvNames) ?? options.azCliDefaultResource ?? DEFAULT_AZ_CLI_RESOURCE;
		const value = await fetchAzCliAccessToken(resource, options.azCliSubscription);
		return { mode: "az-cli", value, resource };
	}

	throw new Error(
		`No credentials for ${options.providerName}. Set API key/token env vars, or sign in with Azure CLI (az login). ` +
			`(Set *_USE_AZ_CLI=0 to disable CLI auth fallback.)`,
	);
}

function resolveAzureFoundryBaseUrl(model: Model<Api>): string {
	const resourceSubscriptionPair = getAzureResourceSubscriptionPair(model.id);
	if (resourceSubscriptionPair) return buildAzureOpenAIBaseUrlFromResource(resourceSubscriptionPair.resourceName);

	const configuredBaseUrl = firstEnvValue(AZURE_BASE_URL_ENV_NAMES);
	if (configuredBaseUrl) return normalizeAzureBaseUrl(configuredBaseUrl);

	const resourceName = firstEnvValue(AZURE_RESOURCE_NAME_ENV_NAMES);
	if (resourceName) return normalizeAzureBaseUrl(`https://${resourceName}.services.ai.azure.com/openai/v1`);

	if (model.baseUrl && model.baseUrl !== DEFAULT_BASE_URL_PLACEHOLDER) {
		return normalizeAzureBaseUrl(model.baseUrl);
	}

	throw new Error(
		"Azure AI Foundry base URL is required. Set AZURE_OPENAI_RESOURCE_SUBSCRIPTION_<MODEL>=<resource>,<subscription>, " +
			"set AZURE_AI_FOUNDRY_BASE_URL (or AZURE_OPENAI_BASE_URL), " +
			"or set AZURE_AI_FOUNDRY_RESOURCE_NAME (or AZURE_OPENAI_RESOURCE_NAME).",
	);
}

function resolveAnthropicFoundryBaseUrl(model: Model<Api>): string {
	const configuredBaseUrl = firstEnvValue(ANTHROPIC_FOUNDRY_BASE_URL_ENV_NAMES);
	if (configuredBaseUrl) return normalizeAnthropicBaseUrl(configuredBaseUrl);

	if (model.baseUrl && model.baseUrl !== DEFAULT_BASE_URL_PLACEHOLDER) {
		return normalizeAnthropicBaseUrl(model.baseUrl);
	}

	throw new Error(
		"Anthropic Foundry base URL is required. Set ANTHROPIC_FOUNDRY_BASE_URL (for example: " +
			"https://<resource>.services.ai.azure.com/anthropic/).",
	);
}

function resolveAzureDeploymentName(modelId: string): string {
	const mapValue = firstEnvValue(AZURE_DEPLOYMENT_MAP_ENV_NAMES);
	const mapped = parseDeploymentNameMap(mapValue).get(modelId);
	return mapped ?? modelId;
}

function resolveAnthropicDeploymentName(modelId: string): string {
	const mapValue = firstEnvValue(ANTHROPIC_FOUNDRY_DEPLOYMENT_MAP_ENV_NAMES);
	const mapped = parseDeploymentNameMap(mapValue).get(modelId);
	if (mapped) return mapped;

	// Match Claude Code's Azure/Foundry convention: use family-level default
	// deployment/model env vars rather than Pi's built-in Anthropic model ids.
	const normalized = modelId.toLowerCase();
	if (normalized.includes("sonnet")) {
		return firstEnvValue(ANTHROPIC_DEFAULT_SONNET_MODEL_ENV_NAMES) ?? modelId;
	}
	if (normalized.includes("haiku")) {
		return firstEnvValue(ANTHROPIC_DEFAULT_HAIKU_MODEL_ENV_NAMES) ?? modelId;
	}
	if (normalized.includes("opus")) {
		return firstEnvValue(ANTHROPIC_DEFAULT_OPUS_MODEL_ENV_NAMES) ?? modelId;
	}
	if (normalized.includes("fable")) {
		return firstEnvValue(ANTHROPIC_DEFAULT_FABLE_MODEL_ENV_NAMES) ?? modelId;
	}

	return modelId;
}

function createErrorMessage(model: Model<Api>, api: Api, error: unknown): AssistantMessage {
	return {
		role: "assistant",
		content: [],
		api,
		provider: model.provider,
		model: model.id,
		usage: {
			input: 0,
			output: 0,
			cacheRead: 0,
			cacheWrite: 0,
			totalTokens: 0,
			cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		},
		stopReason: "error",
		errorMessage: error instanceof Error ? error.message : String(error),
		timestamp: Date.now(),
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function withLowTextVerbosity(payload: Record<string, unknown>): Record<string, unknown> {
	const text = isRecord(payload.text) ? payload.text : {};
	return {
		...payload,
		text: {
			...text,
			verbosity: "low",
		},
	};
}

function clampOpenAIPromptCacheKey(key: string | undefined): string | undefined {
	if (key === undefined) return undefined;
	const chars = Array.from(key);
	if (chars.length <= OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH) return key;
	return chars.slice(0, OPENAI_PROMPT_CACHE_KEY_MAX_LENGTH).join("");
}

/**
 * Match Codex CLI's Azure Responses request shape so caching can start working
 * once Azure's Responses path is fixed:
 * - store: true for Azure Responses endpoints
 * - stable prompt_cache_key from the Pi session id
 * - no forced prompt_cache_retention (deprecated for GPT-5.6+)
 */
function withAzureCodexStyleResponsesCaching(
	options: SimpleStreamOptions | undefined,
): SimpleStreamOptions {
	const originalOnPayload = options?.onPayload;
	return {
		...options,
		onPayload: async (payload: unknown, payloadModel: Model<Api>) => {
			if (!isRecord(payload)) return originalOnPayload?.(payload, payloadModel) ?? payload;

			// Azure AI Foundry rejects OpenAI's server-side model fallback field.
			const {
				fallbacks: _fallbacks,
				prompt_cache_retention: _promptCacheRetention,
				...rest
			} = payload;
			const nextPayload: Record<string, unknown> = withLowTextVerbosity({
				...rest,
				store: true,
			});
			if (options?.cacheRetention !== "none") {
				const promptCacheKey = clampOpenAIPromptCacheKey(options?.sessionId);
				if (promptCacheKey) nextPayload.prompt_cache_key = promptCacheKey;
			}

			return (await originalOnPayload?.(nextPayload, payloadModel)) ?? nextPayload;
		},
	};
}

function streamAzureAIFoundry(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();

	(async () => {
		try {
			const resourceSubscriptionPair = getAzureResourceSubscriptionPair(model.id);
			const resolvedBaseUrl = resolveAzureFoundryBaseUrl(model);
			const deploymentName = resolveAzureDeploymentName(model.id);

			const auth = await resolveAuth({
				providerName: AZURE_PROVIDER_NAME,
				providedApiKey: options?.apiKey,
				apiKeyEnvNames: AZURE_API_KEY_ENV_NAMES,
				authTokenEnvNames: AZURE_AUTH_TOKEN_ENV_NAMES,
				useAzCliEnvNames: AZ_CLI_ENABLE_ENV_NAMES,
				azCliResourceEnvNames: AZ_CLI_RESOURCE_ENV_NAMES,
				azCliDefaultResource: deriveAzureResourceScope(resolvedBaseUrl),
				azCliSubscription: resourceSubscriptionPair?.subscription,
			});

			const mergedHeaders: Record<string, string> = {
				...(model.headers ?? {}),
				...(options?.headers ?? {}),
			};
			if (auth.mode === "api-key") {
				mergedHeaders["api-key"] = auth.value;
			}

			const mappedModel: Model<"openai-responses"> = {
				...(model as unknown as Model<"openai-responses">),
				api: "openai-responses",
				id: deploymentName,
				baseUrl: resolvedBaseUrl,
			};

			const innerStream = streamSimpleOpenAIResponses(
				mappedModel,
				context,
				withAzureCodexStyleResponsesCaching({
					...options,
					apiKey: auth.value,
					headers: Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
				}),
			);

			for await (const event of innerStream) {
				stream.push(event);
			}
			stream.end();
		} catch (error) {
			stream.push({
				type: "error",
				reason: "error",
				error: createErrorMessage(model, CUSTOM_AZURE_API, error),
			});
			stream.end();
		}
	})();

	return stream;
}

function streamAnthropicFoundry(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();

	(async () => {
		try {
			const resolvedBaseUrl = resolveAnthropicFoundryBaseUrl(model);
			const deploymentName = resolveAnthropicDeploymentName(model.id);

			const auth = await resolveAuth({
				providerName: ANTHROPIC_PROVIDER_NAME,
				providedApiKey: options?.apiKey,
				apiKeyEnvNames: ANTHROPIC_FOUNDRY_API_KEY_ENV_NAMES,
				authTokenEnvNames: ANTHROPIC_FOUNDRY_AUTH_TOKEN_ENV_NAMES,
				useAzCliEnvNames: ANTHROPIC_FOUNDRY_USE_AZ_CLI_ENV_NAMES,
				azCliResourceEnvNames: ANTHROPIC_FOUNDRY_AZ_CLI_RESOURCE_ENV_NAMES,
				azCliDefaultResource: deriveAzureResourceScope(resolvedBaseUrl),
			});

			const mappedModel: Model<"anthropic-messages"> = {
				...(model as unknown as Model<"anthropic-messages">),
				api: "anthropic-messages",
				id: deploymentName,
				baseUrl: resolvedBaseUrl,
			};

			const mergedHeaders: Record<string, string | null> = {
				...(model.headers ?? {}),
				...(options?.headers ?? {}),
			};

			// Azure AI Foundry's Anthropic route uses the Claude Messages API path,
			// but Azure API-key auth is accepted via the Azure-style `api-key` header.
			// Suppress the Anthropic SDK's generated X-Api-Key so Azure does not try
			// to validate the wrong header as a subscription key.
			if (auth.mode === "api-key") {
				mergedHeaders["api-key"] = auth.value;
				mergedHeaders["x-api-key"] = null;
			} else {
				mergedHeaders["x-api-key"] = null;
				mergedHeaders.Authorization = `Bearer ${auth.value}`;
			}

			const innerStream = streamSimpleAnthropic(mappedModel, context, {
				...options,
				apiKey: auth.value,
				headers: Object.keys(mergedHeaders).length > 0 ? (mergedHeaders as Record<string, string>) : undefined,
			});

			for await (const event of innerStream) {
				stream.push(event);
			}
			stream.end();
		} catch (error) {
			stream.push({
				type: "error",
				reason: "error",
				error: createErrorMessage(model, CUSTOM_ANTHROPIC_API, error),
			});
			stream.end();
		}
	})();

	return stream;
}

function buildAzureFoundryModels() {
	return getModels("azure-openai-responses").map((model) => ({
		id: model.id,
		name: model.name,
		reasoning: model.reasoning,
		input: model.input,
		cost: model.cost,
		contextWindow: model.contextWindow,
		maxTokens: model.maxTokens,
	}));
}

function buildAnthropicFoundryModels() {
	const models = getModels("anthropic").map((model) => {
		// Azure Foundry does not support Anthropic's server-side model fallback beta.
		// Keep the remaining metadata, including adaptive-thinking support.
		const { allowedFallbackModels: _allowedFallbackModels, ...foundryCompat } = model.compat ?? {};

		return {
			id: model.id,
			name: model.name,
			reasoning: model.reasoning,
			input: model.input,
			cost: model.cost,
			contextWindow: model.contextWindow,
			maxTokens: model.maxTokens,
			compat: foundryCompat,
			thinkingLevelMap: model.thinkingLevelMap,
		};
	});

	if (!models.some((model) => model.id === CLAUDE_SONNET_5_FOUNDRY_MODEL.id)) {
		models.push(CLAUDE_SONNET_5_FOUNDRY_MODEL);
	}
	if (!models.some((model) => model.id === CLAUDE_FABLE_5_FOUNDRY_MODEL.id)) {
		models.push(CLAUDE_FABLE_5_FOUNDRY_MODEL);
	}

	return models;
}

export default function (pi: ExtensionAPI) {
	pi.on("before_provider_request", (event, ctx) => {
		const model = ctx.model;
		if (!model || !GPT_56_MODEL_IDS.has(model.id)) return;
		if (model.provider !== "github-copilot" && model.provider !== AZURE_PROVIDER_NAME) return;
		if (!isRecord(event.payload)) return;
		return withLowTextVerbosity(event.payload);
	});
	const discoveredAzureBaseUrl = firstEnvValue(AZURE_BASE_URL_ENV_NAMES);
	const discoveredAzureResource = firstEnvValue(AZURE_RESOURCE_NAME_ENV_NAMES);
	const azureBaseUrl = discoveredAzureBaseUrl
		? normalizeAzureBaseUrl(discoveredAzureBaseUrl)
		: discoveredAzureResource
			? normalizeAzureBaseUrl(`https://${discoveredAzureResource}.services.ai.azure.com/openai/v1`)
			: DEFAULT_BASE_URL_PLACEHOLDER;

	const discoveredAnthropicBaseUrl = firstEnvValue(ANTHROPIC_FOUNDRY_BASE_URL_ENV_NAMES);
	const anthropicBaseUrl = discoveredAnthropicBaseUrl
		? normalizeAnthropicBaseUrl(discoveredAnthropicBaseUrl)
		: DEFAULT_BASE_URL_PLACEHOLDER;

	pi.registerProvider(AZURE_PROVIDER_NAME, {
		baseUrl: azureBaseUrl,
		apiKey: AUTH_PLACEHOLDER,
		api: CUSTOM_AZURE_API,
		models: buildAzureFoundryModels(),
		streamSimple: streamAzureAIFoundry,
	});

	pi.registerProvider(ANTHROPIC_PROVIDER_NAME, {
		baseUrl: anthropicBaseUrl,
		apiKey: AUTH_PLACEHOLDER,
		api: CUSTOM_ANTHROPIC_API,
		models: buildAnthropicFoundryModels(),
		streamSimple: streamAnthropicFoundry,
	});
}
