"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";

// First-visit welcome tour. Custom Motion overlay rather than Driver.js —
// less weight, design control, respects prefers-reduced-motion.

const STORAGE_KEY = "helix.onboardingSeen.v1";

const STEPS = [
  {
    title: "Welcome to Simedo.",
    body: "A platform for sharing molecular dynamics simulations — real science, beautifully rendered.",
  },
  {
    title: "Every simulation is interactive.",
    body: "Drag to rotate, scroll to zoom. Click an atom to inspect it.",
  },
  {
    title: "An AI guide is built in.",
    body: "Ask questions about any simulation. Answers are grounded in public sources — RCSB, UniProt, papers. Never made up.",
  },
  {
    title: "Browse by category, family, or organism.",
    body: "Find what you're looking for — or stumble onto something you weren't.",
  },
] as const;

export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode / blocked storage — ignore */
    }
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to Simedo"
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-primary"
                />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Simedo · {step + 1} / {STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-1 -mt-1 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <motion.h2
                key={STEPS[step].title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-medium tracking-[-0.02em] text-foreground"
              >
                {STEPS[step].title}
              </motion.h2>
              <motion.p
                key={STEPS[step].body}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {STEPS[step].body}
              </motion.p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={close}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={next}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {step < STEPS.length - 1 ? "Next" : "Done"}
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
