// Two-tier router. Picks Haiku for short factual lookups and Sonnet for
// reasoning-heavy questions. The user can force smart tier via the
// `deepAnalysis` flag.

import type { ModelTier } from "./types";

const REASONING_TRIGGER_WORDS = [
  "why",
  "how does",
  "how do",
  "explain",
  "compare",
  "difference",
  "mechanism",
  "what would happen",
  "predict",
  "interpret",
];

export function chooseTier(
  question: string,
  options: { deepAnalysis?: boolean; conversationLength?: number } = {},
): ModelTier {
  if (options.deepAnalysis) return "smart";
  const q = question.toLowerCase();
  if (q.length > 220) return "smart";
  if (REASONING_TRIGGER_WORDS.some((w) => q.includes(w))) return "smart";
  if (options.conversationLength && options.conversationLength > 4) return "smart";
  return "fast";
}

export const MODEL_FOR_TIER: Record<ModelTier, string> = {
  fast: "claude-haiku-4-5-20251001",
  smart: "claude-sonnet-4-6",
};

export const MAX_TOKENS_FOR_TIER: Record<ModelTier, number> = {
  fast: 500,
  smart: 1500,
};

export const TEMPERATURE_FOR_TIER: Record<ModelTier, number> = {
  fast: 0.2,
  smart: 0.4,
};
