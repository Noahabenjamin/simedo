import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSimulation } from "@/lib/data/simulations";
import { getContextBundle } from "@/lib/ai/context-bundle";
import { buildSystemPrompt, type ViewState } from "@/lib/ai/prompts";
import {
  chooseTier,
  MAX_TOKENS_FOR_TIER,
  MODEL_FOR_TIER,
  TEMPERATURE_FOR_TIER,
} from "@/lib/ai/route";
import { VIEWER_TOOLS } from "@/lib/ai/tools";
import type { ChatMessage, StreamEvent, ToolCall } from "@/lib/ai/types";

// Streaming chat endpoint. POST with { simulationId, messages, viewState, deepAnalysis }.
// Returns text/event-stream lines of StreamEvent JSON.

export const runtime = "nodejs";

type RequestBody = {
  simulationId: string;
  messages: ChatMessage[];
  viewState?: ViewState;
  deepAnalysis?: boolean;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const sim = await getSimulation(body.simulationId);
  if (!sim) return new Response("Simulation not found", { status: 404 });

  const bundle = await getContextBundle(sim);
  const lastUser =
    [...(body.messages ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";
  const tier = chooseTier(lastUser, {
    deepAnalysis: body.deepAnalysis,
    conversationLength: body.messages?.length,
  });
  const model = MODEL_FOR_TIER[tier];

  const systemPrompt = buildSystemPrompt(bundle, body.viewState);

  const anthropic = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (e: StreamEvent) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      };

      try {
        const apiMessages = (body.messages ?? []).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const sdkStream = await anthropic.messages.stream({
          model,
          max_tokens: MAX_TOKENS_FOR_TIER[tier],
          temperature: TEMPERATURE_FOR_TIER[tier],
          system: systemPrompt,
          messages: apiMessages,
          tools: VIEWER_TOOLS,
        });

        const pendingTools: Map<number, ToolCall> = new Map();
        const toolInputBuffers: Map<number, string> = new Map();

        for await (const event of sdkStream) {
          if (event.type === "content_block_start") {
            if (event.content_block.type === "tool_use") {
              pendingTools.set(event.index, {
                id: event.content_block.id,
                name: event.content_block.name as ToolCall["name"],
                input: {},
              });
              toolInputBuffers.set(event.index, "");
            }
          } else if (event.type === "content_block_delta") {
            if (event.delta.type === "text_delta") {
              emit({ type: "delta", text: event.delta.text });
            } else if (event.delta.type === "input_json_delta") {
              const buf = toolInputBuffers.get(event.index) ?? "";
              toolInputBuffers.set(event.index, buf + event.delta.partial_json);
            }
          } else if (event.type === "content_block_stop") {
            const tool = pendingTools.get(event.index);
            if (tool) {
              try {
                const raw = toolInputBuffers.get(event.index) ?? "{}";
                tool.input = JSON.parse(raw);
                emit({ type: "tool", tool });
              } catch {
                /* malformed tool input — ignore */
              }
              pendingTools.delete(event.index);
              toolInputBuffers.delete(event.index);
            }
          }
        }

        // Log usage (in-memory only for now; Phase 4+ writes to ai_usage table).
        const final = await sdkStream.finalMessage();
        console.log("[ai] usage", {
          model,
          input: final.usage.input_tokens,
          output: final.usage.output_tokens,
        });

        emit({ type: "done", messageId: crypto.randomUUID() });
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
