"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MolecularViewer } from "./molecular-viewer";
import { ViewerSkeleton } from "./viewer-skeleton";

// NGL touches `window` and WebGL at module init, so the viewer is client-only.
// Importing the default export sidesteps the named-export + ref-forwarding
// edge case we hit before, where the viewer would never fully mount.

const MolecularViewerLazy = dynamic(() => import("./molecular-viewer"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

type Props = ComponentProps<typeof MolecularViewer>;

export function ViewerShell(props: Props) {
  return <MolecularViewerLazy {...props} />;
}
