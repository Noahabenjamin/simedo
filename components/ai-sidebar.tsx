"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Copy,
  Crosshair,
  Flag,
  Play,
  Send,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { MolecularViewerHandle } from "@/components/viewer/molecular-viewer";
import type { ChatMessage, StreamEvent, ToolCall } from "@/lib/ai/types";

type Props = {
  simulationId: string;
  viewerRef: RefObject<MolecularViewerHandle | null>;
  currentFrame?: number;
  totalFrames?: number;
};

const PLACEHOLDERS = [
  "Ask about this simulation…",
  "What does this loop do?",
  "Why is this residue moving so much?",
  "What's the catalytic mechanism?",
  "Compare with the apo form",
];

const SUGGESTED_PROMPTS = [
  "What is the function of this protein?",
  "Which residues are catalytically important?",
  "What's special about this structure?",
];

type Source = { label: string; url: string };

export function AiSidebar({ simulationId, viewerRef }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rotate the placeholder when idle.
  useEffect(() => {
    if (input || isStreaming || messages.length > 0) return;
    const t = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length),
      4500,
    );
    return () => clearInterval(t);
  }, [input, isStreaming, messages.length]);

  // Auto-scroll on new tokens.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Fetch sources once on mount.
  useEffect(() => {
    fetch(`/api/ai/sources?simulationId=${simulationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSources(d?.sources ?? []))
      .catch(() => setSources([]));
  }, [simulationId]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          simulationId,
          messages: [...messages, userMsg].map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
          deepAnalysis,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        appendToMessage(assistantId, `Error: ${errText}`);
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(json);
          } catch {
            continue;
          }
          handleEvent(assistantId, event);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        appendToMessage(
          assistantId,
          `\n\n_Connection error. ${(err as Error).message}_`,
        );
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleEvent(assistantId: string, event: StreamEvent) {
    if (event.type === "delta") {
      appendToMessage(assistantId, event.text);
    } else if (event.type === "tool") {
      dispatchTool(event.tool);
      setMessages((msgs) =>
        msgs.map((m) =>
          m.id === assistantId
            ? { ...m, toolCalls: [...(m.toolCalls ?? []), event.tool] }
            : m,
        ),
      );
    } else if (event.type === "error") {
      appendToMessage(assistantId, `\n\nError: ${event.message}`);
    }
  }

  function appendToMessage(id: string, text: string) {
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, content: m.content + text } : m)),
    );
  }

  function dispatchTool(tool: ToolCall) {
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (tool.name === "focus_on_residue") {
      const { chain, residue_number } = tool.input as {
        chain: string;
        residue_number: number;
      };
      viewer.focusResidue(chain, residue_number);
    } else if (tool.name === "play_segment") {
      const { start_frame } = tool.input as { start_frame: number };
      viewer.goToFrame(start_frame);
    } else if (tool.name === "highlight_region") {
      const { selection } = tool.input as { selection: string };
      viewer.highlightSelection(selection);
    }
  }

  function report(messageId: string) {
    // Stubbed: fetch('/api/ai/report', ...) when ai_reports table is wired.
    const msg = messages.find((m) => m.id === messageId);
    console.log("[ai] inaccuracy report", { messageId, content: msg?.content });
    alert("Thanks — report logged.");
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
          <h2 className="text-sm font-medium tracking-tight">AI guide</h2>
          <span className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            beta
          </span>
        </div>
        <span
          title="Always verify factual claims against the linked sources before citing."
          className="text-[11px] text-muted-foreground"
        >
          Verify before citing
        </span>
      </div>

      {/* Sources collapsible */}
      <div className="border-b border-border">
        <button
          type="button"
          onClick={() => setSourcesOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <span>Sources used by the AI ({sources.length})</span>
          <span className="font-mono">{sourcesOpen ? "−" : "+"}</span>
        </button>
        {sourcesOpen && (
          <ul className="px-5 pb-3 text-xs">
            {sources.length === 0 ? (
              <li className="text-muted-foreground">No sources resolved yet.</li>
            ) : (
              sources.map((s) => (
                <li key={s.url} className="py-0.5">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground underline-offset-2 hover:text-primary hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Ask anything about this simulation. Answers are grounded in the
              listed sources — no free-form invention.
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                isLast={i === messages.length - 1}
                onReport={() => report(m.id)}
                onDispatchTool={dispatchTool}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex flex-col gap-2 border-t border-border p-3"
      >
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            disabled={isStreaming}
            className="h-10 flex-1 rounded-full px-4"
            aria-label="Ask the AI"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={deepAnalysis}
            onChange={(e) => setDeepAnalysis(e.target.checked)}
            className="size-3"
          />
          Deep analysis (uses the smart model, slower)
        </label>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  onReport,
  onDispatchTool,
}: {
  message: ChatMessage;
  isLast: boolean;
  onReport: () => void;
  onDispatchTool: (tool: ToolCall) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        isUser ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[92%] text-sm leading-relaxed",
          isUser ? "text-foreground" : "text-foreground/90",
        )}
      >
        {renderWithCitations(message.content)}
      </div>

      {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {message.toolCalls.map((tc) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => onDispatchTool(tc)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {tc.name === "focus_on_residue" && (
                <Crosshair className="size-3" />
              )}
              {tc.name === "play_segment" && <Play className="size-3" />}
              {tc.name === "highlight_region" && (
                <Crosshair className="size-3" />
              )}
              {toolButtonLabel(tc)}
            </button>
          ))}
        </div>
      )}

      {!isUser && message.content && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(message.content)}
            title="Copy"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Copy className="size-3" />
            Copy
          </button>
          <button
            type="button"
            onClick={onReport}
            title="Report inaccuracy"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Flag className="size-3" />
            Report
          </button>
        </div>
      )}
    </div>
  );
}

function toolButtonLabel(tc: ToolCall): string {
  if (tc.name === "focus_on_residue") {
    const { chain, residue_number } = tc.input as {
      chain: string;
      residue_number: number;
    };
    return `Show ${chain}:${residue_number}`;
  }
  if (tc.name === "play_segment") {
    const { start_frame, end_frame } = tc.input as {
      start_frame: number;
      end_frame: number;
    };
    return `Play ${start_frame}–${end_frame}`;
  }
  if (tc.name === "highlight_region") {
    return "Highlight region";
  }
  return "Show me where";
}

// Light-touch [Source: ...] rendering. Real superscript-with-hover comes later.
function renderWithCitations(text: string): React.ReactNode {
  const re = /\[Source: ([^\]]+)\]/g;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <sup
        key={i++}
        className="ml-0.5 rounded-sm border border-border bg-background px-1 font-mono text-[9px] text-muted-foreground"
        title={m[1]}
      >
        {i}
      </sup>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
