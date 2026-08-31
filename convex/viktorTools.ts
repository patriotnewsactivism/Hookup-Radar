import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

const VIKTOR_API_URL = process.env.VIKTOR_SPACES_API_URL;
const PROJECT_NAME = process.env.VIKTOR_SPACES_PROJECT_NAME;
const PROJECT_SECRET = process.env.VIKTOR_SPACES_PROJECT_SECRET;
const ENABLED = process.env.VIKTOR_SPACES_ENABLED === "true";
const TIMEOUT_MS = 15_000;

function requireConfiguration() {
  if (!ENABLED) throw new Error("External AI tools are disabled");
  if (!VIKTOR_API_URL || !PROJECT_NAME || !PROJECT_SECRET) {
    throw new Error("External AI tools are not configured");
  }
  return { apiUrl: VIKTOR_API_URL, projectName: PROJECT_NAME, projectSecret: PROJECT_SECRET };
}

async function requireAuthenticatedAction(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function callTool(role: string, args: Record<string, unknown>): Promise<unknown> {
  const config = requireConfiguration();
  const startedAt = Date.now();
  let lastStatus = 0;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${config.apiUrl}/api/viktor-spaces/tools/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: config.projectName,
          project_secret: config.projectSecret,
          role,
          arguments: args,
        }),
        signal: controller.signal,
      });
      lastStatus = response.status;

      if (!response.ok) {
        if (attempt === 0 && (response.status === 429 || response.status >= 500)) continue;
        throw new Error(`External AI provider request failed (${response.status})`);
      }

      const json: unknown = await response.json();
      if (!isRecord(json) || json.success !== true || !("result" in json)) {
        throw new Error("External AI provider returned an invalid response");
      }

      console.info("viktor_tool_call", {
        role,
        latency_ms: Date.now() - startedAt,
        status: response.status,
      });
      return json.result;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        if (attempt === 0) continue;
        throw new Error("External AI provider timed out");
      }
      if (attempt === 0 && lastStatus >= 500) continue;
      throw error instanceof Error ? error : new Error("External AI provider request failed");
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("External AI provider request failed");
}

export const quickAiSearch = action({
  args: { query: v.string() },
  returns: v.string(),
  handler: async (ctx, { query }) => {
    await requireAuthenticatedAction(ctx);
    const normalized = query.trim();
    if (!normalized || normalized.length > 2000) throw new Error("Invalid search query");

    // Calling this user-initiated action is the consent boundary for sending the
    // supplied query to the configured external provider.
    const result = await callTool("quick_ai_search", { search_question: normalized });
    if (!isRecord(result) || typeof result.search_response !== "string") {
      throw new Error("External AI search returned an invalid response");
    }
    return result.search_response;
  },
});

export const generateImage = action({
  args: {
    prompt: v.string(),
    aspectRatio: v.optional(
      v.union(
        v.literal("1:1"),
        v.literal("16:9"),
        v.literal("9:16"),
        v.literal("4:3"),
        v.literal("3:2"),
      ),
    ),
  },
  returns: v.string(),
  handler: async (ctx, { prompt, aspectRatio }) => {
    await requireAuthenticatedAction(ctx);
    const normalized = prompt.trim();
    if (!normalized || normalized.length > 4000) throw new Error("Invalid image prompt");

    const result = await callTool("text2im", {
      prompt: normalized,
      aspect_ratio: aspectRatio ?? "1:1",
    });
    if (!isRecord(result) || typeof result.response_text !== "string") {
      throw new Error("External image provider returned an invalid response");
    }
    return result.response_text;
  },
});
