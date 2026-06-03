import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

// Shared shell for /sign-in /sign-up /forgot-password. Centered, minimal,
// pure white, v2 minimal aesthetic.
export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-12 inline-flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          <span className="text-base font-medium tracking-tight">Simedo</span>
        </Link>

        <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        )}

        <div className="mt-8">{children}</div>

        {footer && (
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        )}
      </div>
    </div>
  );
}
