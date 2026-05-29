"use client";

import dynamic from "next/dynamic";
import { forwardRef, type ComponentProps } from "react";
import type { MolecularViewer, MolecularViewerHandle } from "./molecular-viewer";

// NGL pulls in `window` and WebGL at module init — so we dynamic-import the
// viewer with ssr disabled. Refs are forwarded through so the AI sidebar can
// drive the viewer imperatively.

const MolecularViewerLazy = dynamic(
  () => import("./molecular-viewer").then((m) => m.MolecularViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-foreground/15 border-t-primary" />
          <div className="text-xs font-mono text-muted-foreground">
            Loading viewer
          </div>
        </div>
      </div>
    ),
  },
);

type Props = ComponentProps<typeof MolecularViewer>;

export const ViewerShell = forwardRef<MolecularViewerHandle, Props>(
  function ViewerShell(props, ref) {
    return <MolecularViewerLazy ref={ref} {...props} />;
  },
);
