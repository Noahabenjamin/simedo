"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { resendConfirmation } from "@/lib/auth/resend-confirmation";

type Props = {
  email: string;
  // 'signup' for new account confirmation, 'email_change' for the
  // email-change flow Supabase fires on user.update({ email }).
  type?: "signup" | "email_change";
  variant?: "primary" | "ghost";
  label?: string;
};

export function ResendConfirmationButton({
  email,
  type = "signup",
  variant = "ghost",
  label = "Resend confirmation email",
}: Props) {
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleClick() {
    if (pending || cooldown > 0 || !email) return;
    setPending(true);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("type", type);
    const result = await resendConfirmation(fd);
    setPending(false);
    if (result.ok) {
      toast.success("Sent — check your inbox", {
        description: email,
      });
      setCooldown(result.cooldownSeconds);
    } else {
      toast.error(result.reason);
      if (result.retryAfterSeconds) setCooldown(result.retryAfterSeconds);
    }
  }

  const disabled = pending || cooldown > 0 || !email;
  const display =
    cooldown > 0 ? `Resend in ${cooldown}s` : pending ? "Sending…" : label;

  const cls =
    variant === "primary"
      ? "inline-flex h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-60"
      : "inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-60";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-busy={pending}
      className={cls}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Mail className="size-3.5" />
      )}
      {display}
    </button>
  );
}
