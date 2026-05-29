"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
};

export function CheckboxOption({ label, checked, onChange, count }: Props) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2.5 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-muted/50"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background group-hover:border-foreground/40",
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex-1 text-sm text-foreground">{label}</span>
      {typeof count === "number" && (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
