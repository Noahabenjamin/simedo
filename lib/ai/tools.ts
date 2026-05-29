// Claude tool definitions for viewer control.
// The model returns these as tool_use blocks alongside its text answer; the
// AI sidebar parses them and dispatches to the MolecularViewer ref.

import type Anthropic from "@anthropic-ai/sdk";

export type ViewerToolInput =
  | { type: "focus_on_residue"; chain: string; residue_number: number; reason: string }
  | { type: "play_segment"; start_frame: number; end_frame: number; reason: string }
  | { type: "highlight_region"; selection: string; reason: string };

export const VIEWER_TOOLS: Anthropic.Tool[] = [
  {
    name: "focus_on_residue",
    description:
      "Center the camera on a specific residue and highlight it. Use when discussing a particular residue (catalytic site, binding pocket, mutation, etc.).",
    input_schema: {
      type: "object",
      properties: {
        chain: { type: "string", description: "Chain identifier, e.g. 'A'" },
        residue_number: {
          type: "integer",
          description: "Residue number as it appears in the PDB file",
        },
        reason: {
          type: "string",
          description: "One short sentence explaining why this residue matters",
        },
      },
      required: ["chain", "residue_number", "reason"],
    },
  },
  {
    name: "play_segment",
    description:
      "Jump the trajectory player to a frame range. Use when the question is about motion or change between specific frames.",
    input_schema: {
      type: "object",
      properties: {
        start_frame: { type: "integer", description: "Starting frame number (0-indexed)" },
        end_frame: { type: "integer", description: "Ending frame number (0-indexed)" },
        reason: { type: "string", description: "Short explanation of what to look for" },
      },
      required: ["start_frame", "end_frame", "reason"],
    },
  },
  {
    name: "highlight_region",
    description:
      "Highlight a region of the structure using NGL's selection language. Use for catalytic triads, allosteric sites, binding pockets, etc.",
    input_schema: {
      type: "object",
      properties: {
        selection: {
          type: "string",
          description:
            "NGL selection string, e.g. ':A and (102 or 119 or 30)' for a catalytic triad",
        },
        reason: { type: "string", description: "Short explanation" },
      },
      required: ["selection", "reason"],
    },
  },
];
