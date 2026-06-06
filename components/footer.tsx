"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Site footer. Mirrors the header pattern: the homepage hero already
// reads as a self-contained scroll experience with its own blue menu at
// the end, so we suppress the footer on "/" to avoid double-stacking
// navigation on the same view.

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="mt-auto py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 opacity-70 transition-opacity hover:opacity-100"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          <span className="text-sm font-medium tracking-tight">Simedo</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          <Link
            href="/guidelines"
            className="transition-colors hover:text-foreground"
          >
            Guidelines
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </Link>
          <Link
            href="https://github.com/Noahabenjamin/simedo"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground/70">
          © 2026 Simedo · See molecules in motion
        </p>
      </div>
    </footer>
  );
}
