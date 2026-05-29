import Anthropic from "@anthropic-ai/sdk";

// Server-only Claude client. Never import this from a "use client" file —
// it would expose your API key. Use from /api routes and server actions.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model for the AI sidebar. Sonnet is the right balance of cost,
// speed, and quality for "explain what I'm looking at" responses. Bump to
// `claude-opus-4-7` if we ever need deeper reasoning.
export const DEFAULT_MODEL = "claude-sonnet-4-6";
