import { CardGridSkeleton } from "@/components/skeletons";

export default function BrowseLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 flex flex-col gap-2 lg:mb-12">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-muted/70" />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <aside className="hidden shrink-0 lg:block lg:w-[260px]">
          <div className="sticky top-20 flex max-h-[calc(100vh-6rem)] flex-col gap-3 pr-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </aside>
        <div className="flex-1">
          <CardGridSkeleton count={9} />
        </div>
      </div>
    </div>
  );
}
