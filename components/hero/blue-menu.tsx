"use client";

import Link from "next/link";
import { motion } from "motion/react";

// Final scene: solid blue background with a vertical stack of white nav
// links. Hover: scale 1.08 + white glow. Hover off: glow fades.
//
// Visible only when the parent sequence's progress is ≥ ~0.95. The blue
// background here is what the dive resolves into.

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
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{
        opacity,
        pointerEvents: opacity > 0.5 ? "auto" : "none",
        transition: "opacity 50ms linear",
      }}
    >
      <nav className="flex flex-col items-center gap-5 sm:gap-6">
        {LINKS.map((link) => (
          <motion.div
            key={link.label}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
            className="origin-center"
          >
            <Link
              href={link.href}
              className="block px-6 py-1 text-3xl font-medium tracking-tight text-white transition-[text-shadow,opacity] duration-300 sm:text-4xl"
              style={{
                textShadow: "0 0 0 rgba(255,255,255,0)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "0 0 24px rgba(255,255,255,0.9), 0 0 48px rgba(255,255,255,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textShadow =
                  "0 0 0 rgba(255,255,255,0)";
              }}
            >
              {link.label}
            </Link>
          </motion.div>
        ))}
      </nav>
    </div>
  );
}
