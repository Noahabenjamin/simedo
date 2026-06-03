"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

// Submit button that knows when its parent <form action={…}> is mid-flight.
// While pending: disables clicks, swaps the leading content for a spinner,
// keeps the label text visible. Drop-in replacement for a plain <button>.

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
};

export function PendingButton({
  children,
  className,
  pendingLabel,
  disabled,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      className={className}
      {...rest}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
