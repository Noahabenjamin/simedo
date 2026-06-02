import Link from "next/link";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCount, initials } from "@/lib/format";
import { CATEGORY_LABEL, familySlug } from "@/lib/browse-filters";
import type { Simulation } from "@/types";

type Props = {
  simulation: Simulation;
};

export function SimulationCard({ simulation }: Props) {
  const {
    id,
    title,
    description,
    thumbnailUrl,
    author,
    category,
    proteinFamily,
  } = simulation;

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-foreground/30">
      <div className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-opacity group-hover:opacity-95"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-2">
        <h3 className="line-clamp-1 text-base font-medium tracking-tight text-foreground">
          {/*
            The "card-wide link" pattern: this Link uses a ::before pseudo
            element pinned to the article's bounds, so clicking anywhere on
            the card navigates to the sim — except over the relative-z-10
            pills below, which keep their own clickability.
          */}
          <Link
            href={`/simulation/${id}`}
            className="transition-colors hover:text-primary before:absolute before:inset-0 before:rounded-2xl before:content-['']"
          >
            {title}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="relative z-10 flex flex-wrap gap-1.5">
          <Link
            href={`/browse?category=${category}`}
            className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {CATEGORY_LABEL[category]}
          </Link>
          {proteinFamily && (
            <Link
              href={`/family/${familySlug(proteinFamily)}`}
              className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {proteinFamily}
            </Link>
          )}
          <span className="rounded-md border border-border bg-background px-2 py-0.5 font-mono text-xs text-muted-foreground tabular-nums">
            {simulation.pdbCode}
          </span>
        </div>

        <div className="relative z-10 mt-auto flex items-center justify-between pt-2">
          <Link
            href={`/u/${author.username}`}
            className="flex min-w-0 items-center gap-2 transition-colors hover:text-foreground"
          >
            <Avatar className="size-6 shrink-0">
              <AvatarImage src={author.avatarUrl} alt="" />
              <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">
                {initials(author.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs text-muted-foreground">
              {author.name}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1 tabular-nums">
              <Eye className="size-3.5" />
              {formatCount(simulation.viewCount)}
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <Heart className="size-3.5" />
              {formatCount(simulation.likeCount)}
            </span>
            <span className="flex items-center gap-1 tabular-nums">
              <MessageCircle className="size-3.5" />
              {formatCount(simulation.commentCount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
