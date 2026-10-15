import { complete, type Api, type Model, type Transport } from "@mariozechner/pi-ai";
import { getAgentDir, type ExtensionAPI, type ExtensionContext } from "@mariozechner/pi-coding-agent";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SKILL_PATTERN = /^\/skill:(\S+)\s*([\s\S]*)/;

const DEFAULT_CONFIG = {
  enabled: true,
  provider: "github-copilot",
  model: "claude-haiku-4.5",
  fallbackModels: ["github-copilot/gpt-5.4-mini"],
  timeoutMs: 8_000,
  maxRetries: 0,
  maxTokens: 48,
  maxPromptChars: 4_000,
  debug: false,
  summarize: true,
};

type SmartSessionsConfig = Partial<typeof DEFAULT_CONFIG> & {
  provider?: string;
  model?: string;
  transport?: Transport;
};

const SUMMARY_PROMPT =
  "Summarize the user's request in 5-10 words max. Output ONLY the summary, nothing else. No quotes, no punctuation at the end.";

function readConfigFile(path: string): SmartSessionsConfig {
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadConfig(cwd: string): Required<typeof DEFAULT_CONFIG> & SmartSessionsConfig {
  const globalConfig = readConfigFile(join(getAgentDir(), "smart-sessions.json"));
  const projectConfig = readConfigFile(join(cwd, ".pi", "smart-sessions.json"));
  return { ...DEFAULT_CONFIG, ...globalConfig, ...projectConfig };
}

function parseModelSpecString(spec: string, provider = DEFAULT_CONFIG.provider): { provider: string; model: string } {
  if (spec.includes("/")) {
    const [parsedProvider, ...modelParts] = spec.split("/");
    return { provider: parsedProvider, model: modelParts.join("/") };
  }
  return { provider, model: spec };
}

function parseModelSpec(config: SmartSessionsConfig): { provider: string; model: string } {
  return parseModelSpecString(config.model || DEFAULT_CONFIG.model, config.provider || DEFAULT_CONFIG.provider);
}

async function resolveModel(
  ctx: ExtensionContext,
  config: SmartSessionsConfig,
): Promise<{ model: Model<Api>; apiKey?: string; headers?: Record<string, string> } | null> {
  const candidates: Array<Model<Api> | undefined | null> = [];
  const preferred = parseModelSpec(config);

  candidates.push(ctx.modelRegistry.find(preferred.provider, preferred.model));

  const fallbackSpecs = [
    parseModelSpecString(DEFAULT_CONFIG.model, DEFAULT_CONFIG.provider),
    ...(config.fallbackModels ?? DEFAULT_CONFIG.fallbackModels).map((spec) => parseModelSpecString(spec)),
  ];
  for (const fallback of fallbackSpecs) {
    candidates.push(ctx.modelRegistry.find(fallback.provider, fallback.model));
  }

  candidates.push(ctx.model);

  const seen = new Set<string>();
  for (const model of candidates) {
    if (!model) continue;
    const key = `${model.provider}/${model.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (auth.ok) {
      return { model, apiKey: auth.apiKey, headers: auth.headers };
    }
  }

  return null;
}

function cleanOneLine(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength - 1).trimEnd() + "…" : cleaned;
}

function cleanSummary(text: string): string {
  return cleanOneLine(text, 80)
    .replace(/^["'“”]+/, "")
    .replace(/["'“”.!?]+$/, "")
    .trim();
}

function debug(config: SmartSessionsConfig, ctx: ExtensionContext, message: string): void {
  if (!config.debug) return;
  try {
    if (ctx.hasUI) ctx.ui.notify(`smart-sessions: ${message}`, "info");
  } catch {
    // Ignore stale UI contexts during shutdown/session switches.
  }
}

async function summarizeAndName(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  skillName: string,
  userPrompt: string,
  generation: number,
  getGeneration: () => number,
): Promise<void> {
  const config = loadConfig(ctx.cwd);
  if (!config.enabled || !config.summarize || !userPrompt.trim()) return;

  const resolved = await resolveModel(ctx, config);
  if (!resolved) {
    debug(config, ctx, "no configured or fallback model with auth; keeping temporary name");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs + 250);

  try {
    const prompt = cleanOneLine(userPrompt, config.maxPromptChars);
    const response = await complete(
      resolved.model,
      {
        systemPrompt: SUMMARY_PROMPT,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }], timestamp: Date.now() }],
      },
      {
        apiKey: resolved.apiKey,
        headers: resolved.headers,
        maxTokens: config.maxTokens,
        temperature: 0,
        timeoutMs: config.timeoutMs,
        maxRetries: config.maxRetries,
        signal: controller.signal,
        transport: config.transport,
      },
    );

    if (generation !== getGeneration()) return;
    if (response.stopReason === "error" || response.stopReason === "aborted") return;

    const summary = cleanSummary(
      response.content
        .filter((content): content is { type: "text"; text: string } => content.type === "text")
        .map((content) => content.text)
        .join(""),
    );

    if (summary) {
      pi.setSessionName(`[${skillName}] ${summary}`);
      debug(config, ctx, `renamed with ${resolved.model.provider}/${resolved.model.id}`);
    }
  } catch (error) {
    debug(config, ctx, error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

export default function smartSessions(pi: ExtensionAPI) {
  let named = false;
  let generation = 0;

  pi.on("session_start", () => {
    named = !!pi.getSessionName();
    generation += 1;
  });

  pi.on("session_shutdown", () => {
    generation += 1;
  });

  pi.on("input", (event, ctx) => {
    if (named) return { action: "continue" as const };

    const config = loadConfig(ctx.cwd);
    if (!config.enabled) return { action: "continue" as const };

    const match = event.text.match(SKILL_PATTERN);
    if (!match) return { action: "continue" as const };

    const skillName = match[1];
    const userPrompt = match[2].trim();
    const tempName = userPrompt ? `[${skillName}] ${cleanOneLine(userPrompt, 60)}` : `[${skillName}]`;

    named = true;
    pi.setSessionName(tempName);

    const currentGeneration = generation;
    void summarizeAndName(pi, ctx, skillName, userPrompt, currentGeneration, () => generation).catch(() => {
      // Never allow the background renamer to create an unhandled rejection.
    });

    // Do not await the summarizer. Prompt processing continues immediately.
    return { action: "continue" as const };
  });
}
