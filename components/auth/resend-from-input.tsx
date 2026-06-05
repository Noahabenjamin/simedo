"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ResendConfirmationButton } from "./resend-confirmation-button";

type Props = {
  defaultEmail?: string;
};

// Email-editable resend form. Used on /auth/callback/error where the
// user may have arrived without a stored email; they can type one in
// and trigger the resend without leaving the screen.

export function ResendFromInput({ defaultEmail = "" }: Props) {
  const [email, setEmail] = useState(defaultEmail);
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Email</span>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          autoComplete="email"
          className="h-11"
        />
      </label>
      <ResendConfirmationButton email={email} variant="primary" />
    </div>
  );
}
