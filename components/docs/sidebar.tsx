"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_SECTIONS } from "./docs-config";
import { cn } from "@/lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-7 text-sm">
      <Link
        href="/docs"
        className={cn(
          "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] transition-colors",
          pathname === "/docs"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className="size-1 rounded-full bg-primary"
        />
        Docs
      </Link>

      {DOC_SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            {section.title}
          </div>
          <ul className="flex flex-col">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
