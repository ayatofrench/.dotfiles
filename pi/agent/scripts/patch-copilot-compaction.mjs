#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  copyFileSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const PATCH_VERSION = "0.83.0";
const ORIGINAL_AGENT_SESSION_SHA256 = "9720d2a160540d9515ceb1ac4c4b4e73f4a215d703870c15b3c1863a2e37ff76";
const LEGACY_PATCHED_AGENT_SESSION_SHA256 = "b90d28bb00eb38f5d5be983f375ffb4937dcee25845b20d989ac35741e8e938f";
const PATCHED_AGENT_SESSION_SHA256 = "f37626826960ce62f32720fdc3f4ecb35dfc65b92577a91e09efac62e10f6aeb";
const agentHome = join(process.env.HOME, ".pi", "agent");
const globalRoot = execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim();
const packageRoot = join(globalRoot, "@earendil-works", "pi-coding-agent");
const packageJsonPath = join(packageRoot, "package.json");
const agentSessionPath = join(packageRoot, "dist", "core", "agent-session.js");
const modelsPath = join(agentHome, "models.json");
const authPath = join(agentHome, "auth.json");

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  const last = source.lastIndexOf(before);
  if (first === -1 || first !== last) {
    throw new Error(`Cannot safely patch ${label}: expected exactly one source match`);
  }
  return source.replace(before, after);
}

function atomicWrite(path, content) {
  const mode = statSync(path).mode;
  const temporaryPath = `${path}.tmp-${process.pid}`;
  let fileDescriptor;
  try {
    fileDescriptor = openSync(temporaryPath, "wx", mode);
    writeFileSync(fileDescriptor, content);
    fsyncSync(fileDescriptor);
    closeSync(fileDescriptor);
    fileDescriptor = undefined;
    renameSync(temporaryPath, path);

    const directoryDescriptor = openSync(dirname(path), "r");
    try {
      fsyncSync(directoryDescriptor);
    } finally {
      closeSync(directoryDescriptor);
    }
  } catch (error) {
    if (fileDescriptor !== undefined) closeSync(fileDescriptor);
    if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
    throw error;
  }
}

function backup(path, timestamp) {
  const backupPath = `${path}.bak.copilot-compaction-${timestamp}`;
  copyFileSync(path, backupPath, constants.COPYFILE_EXCL);
  return backupPath;
}

function timestamp() {
  return new Date().toISOString().replace(/[-:.]/g, "");
}

function resolveCopilotBaseUrl() {
  const auth = JSON.parse(readFileSync(authPath, "utf8"));
  const token = auth["github-copilot"]?.access;
  const proxyHost = typeof token === "string" ? token.match(/(?:^|;)proxy-ep=([^;]+)/)?.[1] : undefined;
  if (!proxyHost || !/^proxy\.(individual|business|enterprise)\.githubcopilot\.com$/.test(proxyHost)) {
    throw new Error("Cannot derive a recognized Copilot account endpoint from auth.json");
  }
  return `https://${proxyHost.replace(/^proxy\./, "api.")}`;
}

function patchAgentSession(source) {
  let patched = source;
  patched = replaceOnce(
    patched,
    `            return {\n                apiKey: result.auth.apiKey,`,
    `            return {\n                model: result.auth.baseUrl ? { ...model, baseUrl: result.auth.baseUrl } : model,\n                apiKey: result.auth.apiKey,`,
    "required request auth",
  );
  patched = replaceOnce(
    patched,
    `            return result\n                ? { apiKey: result.auth.apiKey, headers: withoutDeletedHeaders(result.auth.headers), env: result.env }\n                : {};\n        }\n        catch {\n            return {};`,
    `            return result\n                ? {\n                    model: result.auth.baseUrl ? { ...model, baseUrl: result.auth.baseUrl } : model,\n                    apiKey: result.auth.apiKey,\n                    headers: withoutDeletedHeaders(result.auth.headers),\n                    env: result.env,\n                }\n                : { model };\n        }\n        catch {\n            return { model };`,
    "summarization request auth",
  );
  patched = replaceOnce(
    patched,
    `            const { apiKey, headers, env } = await this._getSummarizationRequestAuth(this.model);`,
    `            const { model: requestModel, apiKey, headers, env } = await this._getSummarizationRequestAuth(this.model);`,
    "manual compaction auth",
  );
  patched = replaceOnce(
    patched,
    `                const result = await compact(preparation, this.model, apiKey, headers, customInstructions,`,
    `                const result = await compact(preparation, requestModel, apiKey, headers, customInstructions,`,
    "manual compaction model",
  );
  patched = replaceOnce(
    patched,
    `            let apiKey;\n            let headers;\n            let env;\n            if (this.agent.streamFunction === streamSimple) {\n                ({ apiKey, headers, env } = await this._getRequiredRequestAuth(this.model));\n            }\n            else {\n                ({ apiKey, headers, env } = await this._getSummarizationRequestAuth(this.model));\n            }`,
    `            let apiKey;\n            let headers;\n            let env;\n            let requestModel = this.model;\n            if (this.agent.streamFunction === streamSimple) {\n                ({ model: requestModel, apiKey, headers, env } = await this._getRequiredRequestAuth(requestModel));\n            }\n            else {\n                ({ model: requestModel, apiKey, headers, env } = await this._getSummarizationRequestAuth(requestModel));\n            }`,
    "automatic compaction auth",
  );
  patched = replaceOnce(
    patched,
    `                const compactResult = await compact(preparation, this.model, apiKey, headers, undefined,`,
    `                const compactResult = await compact(preparation, requestModel, apiKey, headers, undefined,`,
    "automatic compaction model",
  );
  patched = replaceOnce(
    patched,
    `                const { apiKey, headers, env } = await this._getSummarizationRequestAuth(model);`,
    `                const { model: requestModel, apiKey, headers, env } = await this._getSummarizationRequestAuth(model);`,
    "branch summarization auth",
  );
  patched = replaceOnce(
    patched,
    `                    model,\n                    apiKey,`,
    `                    model: requestModel,\n                    apiKey,`,
    "branch summarization model",
  );
  return replaceOnce(patched, `//# sourceMappingURL=agent-session.js.map`, ``, "stale source map reference");
}

if (![packageJsonPath, agentSessionPath, modelsPath, authPath].every(existsSync)) {
  throw new Error(`Cannot find the required pi files under ${packageRoot} and ${agentHome}`);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
if (packageJson.version !== PATCH_VERSION) {
  throw new Error(`Refusing to patch version ${packageJson.version}; this patch is guarded for ${PATCH_VERSION}`);
}

// Validate and prepare every input before writing either target.
const copilotBaseUrl = resolveCopilotBaseUrl();
const source = readFileSync(agentSessionPath, "utf8");
const sourceHash = sha256(source);
let patchedSource;
if (sourceHash === ORIGINAL_AGENT_SESSION_SHA256) {
  patchedSource = patchAgentSession(source);
} else if (sourceHash === LEGACY_PATCHED_AGENT_SESSION_SHA256) {
  patchedSource = replaceOnce(source, `//# sourceMappingURL=agent-session.js.map`, ``, "stale source map reference");
} else if (sourceHash === PATCHED_AGENT_SESSION_SHA256) {
  patchedSource = source;
} else {
  throw new Error(`Refusing to patch agent-session.js with unexpected SHA-256 ${sourceHash}`);
}
if (sha256(patchedSource) !== PATCHED_AGENT_SESSION_SHA256) {
  throw new Error("Patched agent-session.js did not match the expected SHA-256");
}

const originalModelsContent = readFileSync(modelsPath, "utf8");
const models = JSON.parse(originalModelsContent);
const copilotProvider = models.providers?.["github-copilot"];
if (!copilotProvider) {
  throw new Error("models.json has no github-copilot provider configuration");
}
const modelsNeedUpdate = copilotProvider.baseUrl !== copilotBaseUrl;
if (modelsNeedUpdate) copilotProvider.baseUrl = copilotBaseUrl;
const patchedModelsContent = modelsNeedUpdate ? `${JSON.stringify(models, null, 2)}\n` : originalModelsContent;

const plans = [];
if (patchedSource !== source) {
  plans.push({ path: agentSessionPath, original: source, patched: patchedSource });
}
if (patchedModelsContent !== originalModelsContent) {
  plans.push({ path: modelsPath, original: originalModelsContent, patched: patchedModelsContent });
}

const stamp = timestamp();
const backups = plans.map((plan) => backup(plan.path, stamp));
try {
  for (const plan of plans) atomicWrite(plan.path, plan.patched);
} catch (error) {
  const rollbackErrors = [];
  for (const plan of plans) {
    try {
      atomicWrite(plan.path, plan.original);
    } catch (rollbackError) {
      rollbackErrors.push(`${plan.path}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  const rollbackMessage = rollbackErrors.length > 0 ? `; rollback failures: ${rollbackErrors.join("; ")}` : "";
  throw new Error(`Patch failed and rollback was attempted: ${message}${rollbackMessage}`);
}

if (backups.length > 0) {
  if (patchedSource !== source) console.log(`Patched ${agentSessionPath}`);
  if (modelsNeedUpdate) console.log(`Updated github-copilot baseUrl in ${modelsPath} to ${copilotBaseUrl}`);
  console.log("Backups:");
  for (const path of backups) console.log(`  ${path}`);
} else {
  console.log(`Already patched: ${agentSessionPath}`);
  console.log(`Copilot baseUrl already matches authenticated account: ${copilotBaseUrl}`);
}
console.log("Patch complete. Restart pi before testing /compact.");
