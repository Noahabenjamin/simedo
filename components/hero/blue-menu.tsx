"use client";

import Link from "next/link";
import { motion } from "motion/react";

// Final scene: the camera has pulled back into a dark vista with the helix
// drifting on the right. The menu reads on the left as a numbered column
// in Inter, with mono-numbered indices, an eyebrow, and a footer line.
// Hover lights the number cyan and slides the label right.

const LINKS = [
  { num: "01", label: "Home", href: "/" },
  { num: "02", label: "Browse", href: "/browse" },
  { num: "03", label: "Upload", href: "/upload" },
  { num: "04", label: "Docs", href: "/docs" },
  { num: "05", label: "About", href: "/about" },
] as const;

type Props = {
  opacity: number;
};

export function BlueMenu({ opacity }: Props) {
  if (opacity < 0.01) return null;
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-between py-12 pl-[8vw] pr-6 sm:py-16 sm:pl-[10vw] lg:py-20 lg:pl-[12vw]"
      style={{
        opacity,
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        transition: "opacity 50ms linear",
        fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
        color: "#FFFFFF",
      }}
    >
      {/* Header — small Helix wordmark + thin divider */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3"
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-cyan-300" />
        <span className="text-sm font-medium tracking-tight text-white/90">
          Helix
        </span>
        <span aria-hidden="true" className="h-px w-12 bg-white/20" />
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-white/40"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          v0.1 · 2026
        </span>
      </motion.div>

      {/* Center — main menu */}
      <div className="flex max-w-2xl flex-col gap-6">
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
          className="text-[10px] uppercase tracking-[0.32em] text-white/40"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Continue to
        </motion.span>

        <nav className="flex flex-col gap-2 sm:gap-3">
          {LINKS.map((link, i) => (
            <motion.div
              key={link.label}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.1 + i * 0.06,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link href={link.href} className="group block">
                <div className="flex items-baseline gap-5 sm:gap-7">
                  <span
                    className="font-mono text-xs tracking-wider text-white/35 transition-colors duration-300 group-hover:text-cyan-300 sm:text-sm"
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    {link.num}
                  </span>
                  <div className="relative">
                    <span
                      className="block text-[40px] font-medium leading-[1.02] tracking-[-0.025em] text-white transition-transform duration-300 ease-out group-hover:translate-x-2 sm:text-[52px] lg:text-[64px]"
                      style={{ fontWeight: 500 }}
                    >
                      {link.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-1 block h-px w-0 bg-cyan-300/80 transition-[width] duration-500 ease-out group-hover:w-full"
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Footer — tagline + status line */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-col gap-3"
      >
        <p className="max-w-md text-[13px] leading-relaxed text-white/55">
          An open platform to share, explore, and discuss molecular dynamics
          simulations.
        </p>
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] uppercase tracking-[0.22em] text-white/35"
          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-1 rounded-full bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            />
            Closed beta
          </span>
          <span aria-hidden="true" className="h-px w-6 bg-white/20" />
          <Link
            href="/contact"
            className="transition-colors hover:text-white/70"
          >
            Request access
          </Link>
          <span aria-hidden="true" className="h-px w-6 bg-white/20" />
          <span>Inter · JetBrains Mono</span>
        </div>
      </motion.div>
    </div>
  );
}
