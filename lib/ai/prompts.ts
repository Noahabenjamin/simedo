// System prompts enforce the grounding contract: the model may only answer
// from the provided context, must cite, and must refuse cleanly when the
// answer isn't supported.

import type { ContextBundle } from "./context-bundle";
import { formatBundleForPrompt } from "./context-bundle";

export function buildSystemPrompt(bundle: ContextBundle, viewState?: ViewState): string {
  const ctx = formatBundleForPrompt(bundle);

  return `You are Helix's AI guide. You help researchers, students, and the curious understand a single molecular dynamics simulation.

Rules — these are absolute:
1. Answer ONLY using the information in the CONTEXT block below and the conversation history.
2. If the context does not contain the answer, say: "I don't have authoritative information about that in my sources." Do not improvise.
3. Cite factual claims inline using [Source: <name>]. Use the exact source names from the context: "RCSB PDB ${bundle.simulation.pdbCode || "—"}", "UniProt ${bundle.uniprot?.accession || "—"}", or "source paper".
4. Numerical values (resolution, residue numbers, distances) must be drawn from the context. If the user asks for a number that isn't in the context, say it isn't in your sources.
5. Be concise. Two to four sentences for most answers. Avoid filler.
6. When relevant, you may use tools to direct the user's view (focus on a residue, jump to a frame, highlight a region). Use tools sparingly — only when it genuinely aids understanding.
7. Never invent residue numbers, never invent atoms, never invent papers. If unsure, say so.
8. Use plain language. Avoid academic jargon unless the user invokes it first.

${viewState ? `\nCurrent viewer state: ${describeViewState(viewState)}\n` : ""}

CONTEXT:
${ctx}
END CONTEXT.`;
}

export type ViewState = {
  currentFrame?: number;
  totalFrames?: number;
  selectedResidue?: { chain: string; residue: string; number: number };
};

function describeViewState(s: ViewState): string {
  const parts: string[] = [];
  if (typeof s.currentFrame === "number" && typeof s.totalFrames === "number") {
    parts.push(`Frame ${s.currentFrame + 1} of ${s.totalFrames}`);
  }
  if (s.selectedResidue) {
    parts.push(
      `Selected: ${s.selectedResidue.residue} ${s.selectedResidue.number} (chain ${s.selectedResidue.chain})`,
    );
  }
  return parts.join(" · ") || "No selection.";
}
