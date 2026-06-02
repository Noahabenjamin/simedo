import { CardGridSkeleton } from "@/components/skeletons";

export default function ProfileLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="size-24 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-3">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-3 w-64 animate-pulse rounded bg-muted/70" />
          <div className="h-3 w-full max-w-md animate-pulse rounded bg-muted/70" />
          <div className="flex gap-4">
            <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </header>
      <div className="h-9 w-full animate-pulse rounded border-b border-border bg-transparent" />
      <CardGridSkeleton count={6} />
    </div>
  );
}
