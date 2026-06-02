"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { signOut } from "@/lib/auth/actions";

type Props = {
  viewer: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
};

// Small avatar dropdown for the header. Closes on outside click, on Esc,
// and when a link is followed.

export function AccountMenu({ viewer }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="flex size-9 items-center justify-center rounded-full transition-opacity hover:opacity-85"
      >
        <Avatar className="size-9">
          <AvatarImage src={viewer.avatarUrl} alt="" />
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            {initials(viewer.displayName)}
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-background shadow-lg"
        >
          <Link
            href={`/u/${viewer.username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-border px-3 py-3 transition-colors hover:bg-muted"
          >
            <Avatar className="size-8">
              <AvatarImage src={viewer.avatarUrl} alt="" />
              <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                {initials(viewer.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {viewer.displayName}
              </span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                @{viewer.username}
              </span>
            </div>
          </Link>

          <Link
            href={`/u/${viewer.username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <UserRound className="size-4 text-muted-foreground" />
            View profile
          </Link>
          <Link
            href="/onboarding"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <Settings className="size-4 text-muted-foreground" />
            Edit profile
          </Link>

          <form action={signOut} className="border-t border-border">
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="size-4 text-muted-foreground" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
