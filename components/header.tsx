"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccountMenu } from "@/components/account-menu";

function openPalette(initialQuery?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("helix:open-palette", {
      detail: initialQuery ? { initialQuery } : {},
    }),
  );
}

type Props = {
  viewer: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  } | null;
};

export function Header({ viewer }: Props) {
  const pathname = usePathname();
  // Homepage uses the studio-style inline nav inside the hero;
  // suppress the global header there so we don't double-stack.
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-5">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-primary"
            />
            <span className="text-base font-medium tracking-tight text-foreground">
              Helix
            </span>
          </Link>
          <Link
            href="/browse"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Browse
          </Link>
        </div>

        <button
          type="button"
          onClick={() => openPalette()}
          className="relative hidden h-10 max-w-md flex-1 items-center gap-3 rounded-full border border-border bg-background pl-4 pr-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground md:flex"
          aria-label="Open search"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search simulations, people</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => openPalette()}
            aria-label="Open search"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <Search className="size-4" />
          </button>
          {viewer ? (
            <>
              <Link
                href="/upload"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Upload
              </Link>
              <ThemeToggle />
              <AccountMenu viewer={viewer} />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/upload"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Upload
              </Link>
              <ThemeToggle />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
