"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { formatEuro } from "@/lib/donate/costs";

const PRESETS = [3, 5, 10, 25] as const;
type Preset = (typeof PRESETS)[number];

export function DonateForm() {
  const [preset, setPreset] = useState<Preset | "custom">(5);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amount =
    preset === "custom" ? parseFloat(custom.replace(",", ".")) : preset;
  const validAmount = Number.isFinite(amount) && amount >= 1 && amount <= 1000;

  function submit() {
    if (!validAmount) {
      setError("Pick an amount between €1 and €1000.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/donate/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setError(data.error ?? "Could not start checkout.");
          return;
        }
        window.location.href = data.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <p className="text-sm font-medium text-foreground">Pick an amount</p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {PRESETS.map((p) => {
          const active = preset === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`rounded-full border py-2 text-sm font-medium tabular-nums transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-foreground/30"
              }`}
              aria-pressed={active}
            >
              {formatEuro(p)}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-stretch gap-2">
        <div
          className={`flex flex-1 items-center gap-2 rounded-full border px-4 transition-colors ${
            preset === "custom"
              ? "border-primary"
              : "border-border hover:border-foreground/30"
          }`}
        >
          <span className="text-sm text-muted-foreground">€</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Custom amount"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPreset("custom");
            }}
            onFocus={() => setPreset("custom")}
            className="w-full bg-transparent py-2 text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Custom donation amount in euros"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Opening checkout…"
          : validAmount
            ? `Donate ${formatEuro(amount)}`
            : "Donate"}
        {!pending && <ArrowRight className="size-4" />}
      </button>

      {error && (
        <p className="mt-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
