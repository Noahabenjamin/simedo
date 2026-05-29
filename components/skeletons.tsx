// Minimal skeleton placeholders for Suspense fallbacks.
// Designed to match the v2 minimal aesthetic — flat surfaces, 1px borders,
// no shimmers, no gradients. A subtle pulse on the inner blocks is enough.

export function CardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-3">
      <div className="aspect-video animate-pulse rounded-xl bg-muted" />
      <div className="flex flex-col gap-2 p-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
