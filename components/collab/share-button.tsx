"use client";

import { useState } from "react";
import { Check, Code, Copy, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { track } from "@/lib/analytics";

// Share + embed modal. Triggered by the "Share" button on the simulation page.

type Props = {
  simulationId: string;
};

export function ShareButton({ simulationId }: Props) {
  const [open, setOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/simulation/${simulationId}`
      : "";
  const embedCode = `<iframe src="${
    typeof window !== "undefined" ? window.location.origin : ""
  }/embed/${simulationId}" width="640" height="480" allow="fullscreen" style="border:1px solid #EAEAEA;border-radius:12px"></iframe>`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    track("simulation_shared", { simulationId });
    setTimeout(() => setCopiedLink(false), 1500);
  }

  async function copyEmbed() {
    await navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    track("embed_code_copied", { simulationId });
    setTimeout(() => setCopiedEmbed(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/30"
      >
        <Share2 className="size-3.5" />
        Share
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-medium tracking-[-0.01em]">
                    Share this simulation
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can view.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Link</span>
                  <div className="flex items-center gap-2">
                    <Input value={url} readOnly className="h-10 font-mono text-xs" />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:border-foreground/30"
                      aria-label="Copy link"
                    >
                      {copiedLink ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Code className="size-3" /> Embed in your site
                  </span>
                  <div className="flex items-stretch gap-2">
                    <pre className="flex-1 overflow-x-auto rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-[11px] leading-snug text-foreground/80">
                      {embedCode}
                    </pre>
                    <button
                      type="button"
                      onClick={copyEmbed}
                      className="flex shrink-0 items-center justify-center rounded-md border border-border px-3 transition-colors hover:border-foreground/30"
                      aria-label="Copy embed code"
                    >
                      {copiedEmbed ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Embedded views respect simulation privacy — private
                    simulations don&apos;t render.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
