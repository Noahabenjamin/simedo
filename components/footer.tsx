import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 opacity-70">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          <span className="text-sm font-medium tracking-tight">Helix</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="/about" className="transition-colors hover:text-foreground">
            About
          </Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground/70">
          © 2026 Helix · See molecules in motion
        </p>
      </div>
    </footer>
  );
}
