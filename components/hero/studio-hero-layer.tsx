"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";

// Studio hero overlay — the existing studio layout, lifted into a layer
// component so its opacity can be driven by scroll progress.
//
// Visual identical to the original hero.tsx. Only difference: a static
// `style={{ opacity }}` and a `pointer-events: none` switch at low opacity.

const ACCENT = "#5E0ED7";

const NAV_LINKS = [
  { label: "Browse", href: "/browse" },
  { label: "Upload", href: "/upload" },
  { label: "Docs", href: "/docs" },
  { label: "About", href: "/about" },
] as const;

const STATS = [
  { value: "12K", label: "SHARED\nSIMULATIONS" },
  { value: "4K", label: "ACTIVE\nRESEARCHERS" },
  { value: "89", label: "INSTITUTIONS\nWORLDWIDE" },
] as const;

const HEADLINE_WORDS = ["MOLECULES", "IN", "MOTION"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: EASE },
  }),
};

const fadeUp: Variants = {
  initial: { opacity: 0, y: 32 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: EASE },
  }),
};

const headingSlide: Variants = {
  initial: { y: "110%" },
  animate: (i: number) => ({
    y: 0,
    transition: { delay: 0.4 + i * 0.14, duration: 0.7, ease: EASE },
  }),
};

type Props = { opacity: number };

export function StudioHeroLayer({ opacity }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const visible = opacity > 0.05;

  return (
    <div
      className="absolute inset-0 z-20 flex min-h-full flex-col text-black"
      style={{
        fontFamily: "var(--font-inter), Inter, sans-serif",
        opacity,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 50ms linear",
      }}
      aria-hidden={!visible}
    >
      <nav className="relative z-10 flex items-center justify-between gap-4 pl-[48vw] pr-5 pt-5 sm:pl-[44vw] sm:pr-8 md:pl-[40vw] md:pr-12 md:pt-6 lg:pl-[32vw]">
        <motion.div
          variants={fadeDown}
          custom={0}
          initial="initial"
          animate="animate"
        >
          <Logo />
        </motion.div>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link, i) => (
            <motion.li
              key={link.label}
              variants={fadeDown}
              custom={i + 1}
              initial="initial"
              animate="animate"
            >
              <Link
                href={link.href}
                className="text-sm font-semibold uppercase tracking-widest text-black transition-opacity hover:opacity-60"
              >
                {link.label}
              </Link>
            </motion.li>
          ))}
        </ul>

        <motion.button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex size-9 flex-col items-center justify-center gap-1 rounded-full bg-black"
          variants={fadeDown}
          custom={5}
          initial="initial"
          animate="animate"
        >
          <span aria-hidden="true" className="h-0.5 w-4 bg-white" />
          <span aria-hidden="true" className="h-0.5 w-4 bg-white" />
          <span aria-hidden="true" className="h-0.5 w-4 bg-white" />
        </motion.button>
      </nav>

      <div className="relative z-10 flex flex-1 items-center justify-end px-5 py-8 sm:px-8 md:px-12 md:py-0">
        <div className="flex items-baseline gap-5 sm:gap-8 md:gap-10">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-end"
              variants={fadeUp}
              custom={i + 2}
              initial="initial"
              animate="animate"
            >
              <div
                style={{ fontSize: "clamp(1.5rem, 5vw, 3.5rem)" }}
                className="flex items-baseline gap-0.5 font-semibold leading-none"
              >
                <span
                  className="font-semibold"
                  style={{ fontSize: "0.5em", color: ACCENT }}
                >
                  +
                </span>
                <span className="tabular-nums text-black">{stat.value}</span>
              </div>
              <div className="mt-1.5 whitespace-pre-line text-right text-[10px] font-semibold uppercase leading-tight tracking-widest text-black sm:text-xs md:text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-6 px-5 pb-8 sm:px-8 md:gap-12 md:px-12 md:pb-12">
        <div className="flex items-center justify-between gap-4">
          <motion.p
            className="max-w-[130px] text-[10px] font-semibold uppercase leading-tight tracking-widest sm:max-w-[160px] sm:text-xs md:max-w-xs md:text-sm"
            variants={fadeUp}
            custom={5}
            initial="initial"
            animate="animate"
          >
            Open Science
            <br />
            In Motion
            <br />
            For Everyone
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={6}
            initial="initial"
            animate="animate"
          >
            <Link
              href="/upload"
              className="flex items-center gap-2 whitespace-nowrap text-base font-semibold uppercase tracking-wide sm:text-xl md:text-2xl"
              style={{ color: ACCENT }}
            >
              Get Started
              <ArrowUpRight
                className="size-[18px] sm:size-[22px]"
                strokeWidth={2}
              />
            </Link>
          </motion.div>
        </div>

        <div className="flex items-end justify-between gap-3 sm:gap-4">
          <motion.p
            className="w-[120px] shrink-0 text-left text-[9px] font-semibold uppercase leading-tight tracking-widest sm:w-[180px] sm:text-xs md:w-[280px] md:text-right md:text-sm"
            variants={fadeUp}
            custom={7}
            initial="initial"
            animate="animate"
          >
            An open platform to share, explore, and discuss molecular dynamics
            simulations
          </motion.p>

          <div className="flex flex-col items-end">
            {HEADLINE_WORDS.map((word, i) => (
              <div key={word} className="overflow-hidden">
                <motion.div
                  variants={headingSlide}
                  custom={i}
                  initial="initial"
                  animate="animate"
                  style={{
                    fontSize: "clamp(2rem, 9vw, 9rem)",
                    lineHeight: 0.88,
                  }}
                  className="font-semibold uppercase text-black"
                >
                  {word}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      aria-label="Helix home"
      className="flex size-8 items-center justify-center rounded-full border-2"
      style={{ borderColor: ACCENT }}
    >
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full"
        style={{ backgroundColor: ACCENT }}
      />
    </Link>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      className="fixed inset-0 z-50 flex flex-col bg-white px-5 pt-5 pb-8 sm:px-8 sm:pt-6"
    >
      <div className="flex items-center justify-between">
        <Logo />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex size-9 items-center justify-center rounded-full bg-black text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="mt-16 flex flex-col gap-8">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={onClose}
            className="text-3xl font-semibold uppercase tracking-widest text-black"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <Link
          href="/upload"
          onClick={onClose}
          className="flex items-center gap-2 text-xl font-semibold uppercase tracking-widest"
          style={{ color: ACCENT }}
        >
          Get Started
          <ArrowUpRight className="size-5" strokeWidth={2} />
        </Link>
      </div>
    </motion.div>
  );
}
