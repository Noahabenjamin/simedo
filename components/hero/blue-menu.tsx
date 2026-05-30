"use client";

import Link from "next/link";
import { motion } from "motion/react";

// Final scene: solid blue background with a vertical stack of pure-white nav
// links on the LEFT side of the viewport. Refined Inter type, no glow on
// hover — instead a thin white underline sweeps from left to right and the
// label nudges slightly to the right.
//
// Visible only when the parent sequence's progress is ≥ ~0.95.

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Upload", href: "/upload" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
] as const;

type Props = {
  opacity: number;
};

export function BlueMenu({ opacity }: Props) {
  if (opacity < 0.01) return null;
  return (
    <div
      className="absolute inset-0 z-30 flex items-center"
      style={{
        opacity,
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        transition: "opacity 50ms linear",
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
      }}
    >
      <nav className="flex flex-col items-start gap-4 pl-[8vw] sm:gap-5 sm:pl-[10vw] lg:pl-[12vw]">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.32em] text-white/70">
          <span aria-hidden="true" className="size-1 rounded-full bg-white/80" />
          Helix
        </div>

        {LINKS.map((link, i) => (
          <motion.div
            key={link.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.05 + i * 0.05,
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href={link.href}
              className="group inline-flex flex-col items-start"
            >
              <span
                className="text-[44px] font-medium leading-[1.05] tracking-[-0.025em] text-white transition-transform duration-300 ease-out group-hover:translate-x-1.5 sm:text-[56px] lg:text-[64px]"
                style={{ color: "#FFFFFF" }}
              >
                {link.label}
              </span>
              <span
                aria-hidden="true"
                className="mt-1.5 block h-px w-0 bg-white transition-[width] duration-500 ease-out group-hover:w-full"
              />
            </Link>
          </motion.div>
        ))}
      </nav>
    </div>
  );
}
