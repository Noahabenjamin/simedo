export default function SimulationLoading() {
  return (
    <div className="flex flex-1 flex-col gap-16 pb-24 pt-6 lg:pt-8">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-10 lg:gap-6">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="relative h-[55vh] animate-pulse overflow-hidden rounded-2xl border border-border bg-muted/70 sm:h-[60vh] lg:h-[70vh]" />
            <div className="flex flex-col gap-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-full bg-muted" />
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted/70" />
                </div>
              </div>
              <div className="h-4 w-full animate-pulse rounded bg-muted/70" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted/70" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-16 animate-pulse rounded-full bg-muted"
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="animate-pulse rounded-2xl border border-border bg-muted/50 lg:col-span-3 lg:h-[70vh]" />
        </div>
      </section>
    </div>
  );
}
