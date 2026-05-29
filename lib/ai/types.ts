// Shared types for the AI subsystem.

export type ModelTier = "fast" | "smart";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string;
};

export type ToolCall = {
  id: string;
  name: "focus_on_residue" | "play_segment" | "highlight_region";
  input: Record<string, unknown>;
};

// Stream event types — the api route sends these as text/event-stream lines.
export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "tool"; tool: ToolCall }
  | { type: "done"; messageId: string }
  | { type: "error"; message: string };
