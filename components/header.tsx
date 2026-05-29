"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
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

        <div className="relative hidden flex-1 max-w-md mx-auto md:flex">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search simulations"
            className="h-10 rounded-full pl-11 pr-4 text-sm"
            aria-label="Search simulations"
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
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
        </div>
      </div>
    </header>
  );
}
