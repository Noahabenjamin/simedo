"use client";

// Tiny typed window-event bus so non-workspace components (comments,
// presence layer, debug tools) can drive the viewer without threading
// the imperative handle through React trees.
//
// Events:
//   helix:viewer-focus       — caller wants the viewer to focus a residue
//   helix:viewer-goto-frame  — caller wants the trajectory at frame N
//   helix:viewer-highlight   — caller wants an NGL selection highlighted
//   helix:viewer-frame       — viewer reports its current frame number
//   helix:viewer-atom-pick   — viewer reports the most recently picked atom

export type ViewerFocusDetail = { chain: string; residueNumber: number };
export type ViewerGotoFrameDetail = { frame: number };
export type ViewerHighlightDetail = { selection: string };
export type ViewerFrameDetail = { frame: number };
export type ViewerAtomPickDetail = {
  chain: string;
  residueNumber: number;
  resname: string;
  atomname: string;
};

type EventMap = {
  "helix:viewer-focus": ViewerFocusDetail;
  "helix:viewer-goto-frame": ViewerGotoFrameDetail;
  "helix:viewer-highlight": ViewerHighlightDetail;
  "helix:viewer-frame": ViewerFrameDetail;
  "helix:viewer-atom-pick": ViewerAtomPickDetail;
};

export function emit<K extends keyof EventMap>(
  name: K,
  detail: EventMap[K],
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function subscribe<K extends keyof EventMap>(
  name: K,
  handler: (detail: EventMap[K]) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    handler((e as CustomEvent<EventMap[K]>).detail);
  };
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
