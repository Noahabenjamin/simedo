import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SimulationCard } from "@/components/simulation-card";
import { FollowButton } from "@/components/u/follow-button";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { isDbAvailable } from "@/lib/data/db-available";
import {
  getProfileByUsername,
  getProfileLikes,
  getProfileSimulations,
  isFollowing,
} from "@/lib/data/profiles";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile not found — Helix" };
  return {
    title: `${profile.displayName} (@${profile.username}) — Helix`,
    description: profile.bio || `Profile of @${profile.username} on Helix.`,
  };
}

const TABS = ["simulations", "likes", "about"] as const;
type Tab = (typeof TABS)[number];

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "simulations";

  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  const [simulations, likes, viewerUserId] = await Promise.all([
    tab === "simulations" ? getProfileSimulations(profile.id) : Promise.resolve([]),
    tab === "likes" ? getProfileLikes(profile.id) : Promise.resolve([]),
    getViewerUserId(),
  ]);

  const followingNow =
    viewerUserId && viewerUserId !== profile.id
      ? await isFollowing(viewerUserId, profile.id)
      : false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <Avatar className="size-24 shrink-0">
          <AvatarImage src={profile.avatarUrl} alt="" />
          <AvatarFallback className="bg-muted text-lg text-muted-foreground">
            {initials(profile.displayName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-3xl">
              {profile.displayName}
            </h1>
            {profile.isSeed && (
              <span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                seed contributor
              </span>
            )}
            {profile.isVerifiedAcademic && (
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
                verified academic
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-sm text-muted-foreground">
            <span>@{profile.username}</span>
            {profile.institution && <span>· {profile.institution}</span>}
            {profile.orcid && (
              <a
                href={`https://orcid.org/${profile.orcid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                · ORCID {profile.orcid}
              </a>
            )}
          </div>

          {profile.bio && (
            <p className="max-w-prose text-sm leading-relaxed text-foreground/85">
              {profile.bio}
            </p>
          )}

          <div className="flex items-center gap-6 font-mono text-xs text-muted-foreground">
            <span className="tabular-nums">
              <span className="text-foreground">{profile.simulationCount}</span>{" "}
              simulations
            </span>
            <span className="tabular-nums">
              <span className="text-foreground">{profile.followerCount}</span>{" "}
              followers
            </span>
            <span className="tabular-nums">
              <span className="text-foreground">{profile.followingCount}</span>{" "}
              following
            </span>
          </div>
        </div>

        <FollowButton
          profileId={profile.id}
          viewerUserId={viewerUserId}
          initiallyFollowing={followingNow}
          disabled={profile.isSeed}
        />
      </header>

      <nav
        className="flex items-center gap-6 border-b border-border"
        aria-label="Profile sections"
      >
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <Link
              key={t}
              href={`/u/${profile.username}${t === "simulations" ? "" : `?tab=${t}`}`}
              className={`relative -mb-px border-b-2 pb-3 text-sm capitalize transition-colors ${
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </Link>
          );
        })}
      </nav>

      <section>
        {tab === "simulations" && (
          <SimulationsList simulations={simulations} ownerName={profile.displayName} />
        )}
        {tab === "likes" && (
          <LikesList likes={likes} ownerName={profile.displayName} />
        )}
        {tab === "about" && <AboutTab profile={profile} />}
      </section>
    </div>
  );
}

function SimulationsList({
  simulations,
  ownerName,
}: {
  simulations: Awaited<ReturnType<typeof getProfileSimulations>>;
  ownerName: string;
}) {
  if (simulations.length === 0) {
    return (
      <EmptyState
        title={`${ownerName} hasn't published anything yet`}
        body="When they upload a simulation it'll show up here."
        ctaHref="/browse"
        ctaLabel="Browse simulations"
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {simulations.map((s) => (
        <SimulationCard key={s.id} simulation={s} />
      ))}
    </div>
  );
}

function LikesList({
  likes,
  ownerName,
}: {
  likes: Awaited<ReturnType<typeof getProfileLikes>>;
  ownerName: string;
}) {
  if (likes.length === 0) {
    return (
      <EmptyState
        title={`No likes yet`}
        body={`When ${ownerName} likes a simulation it'll show up here.`}
        ctaHref="/browse"
        ctaLabel="Browse simulations"
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {likes.map((s) => (
        <SimulationCard key={s.id} simulation={s} />
      ))}
    </div>
  );
}

function AboutTab({
  profile,
}: {
  profile: Awaited<ReturnType<typeof getProfileByUsername>> & object;
}) {
  return (
    <dl className="grid max-w-xl grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
      <Row k="Username" v={`@${profile.username}`} />
      {profile.institution && <Row k="Institution" v={profile.institution} />}
      {profile.orcid && (
        <Row
          k="ORCID"
          v={
            <a
              href={`https://orcid.org/${profile.orcid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              {profile.orcid}
            </a>
          }
        />
      )}
      <Row
        k="Joined"
        v={new Date(profile.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      />
      {profile.bio && (
        <Row k="Bio" v={<span className="leading-relaxed">{profile.bio}</span>} />
      )}
    </dl>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <>
      <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {k}
      </dt>
      <dd className="text-foreground">{v}</dd>
    </>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-16 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{body}</p>
      <Link
        href={ctaHref}
        className="mt-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs text-foreground transition-colors hover:border-foreground/30"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

async function getViewerUserId(): Promise<string | null> {
  if (!isDbAvailable()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
