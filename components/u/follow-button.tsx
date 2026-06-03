import Link from "next/link";
import { toggleFollow } from "@/lib/profile-actions";
import { PendingButton } from "@/components/ui/pending-button";

type Props = {
  profileId: string;
  viewerUserId: string | null;
  initiallyFollowing: boolean;
  disabled?: boolean;
};

// Server-action backed follow button. Three modes:
// - Signed-out: link to /sign-in with redirect back to this profile.
// - Own profile or seed account: hidden / disabled.
// - Otherwise: a form that posts to toggleFollow.

export function FollowButton({
  profileId,
  viewerUserId,
  initiallyFollowing,
  disabled,
}: Props) {
  if (disabled) {
    return null;
  }
  if (!viewerUserId) {
    return (
      <Link
        href="/sign-in"
        className="self-start whitespace-nowrap rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30"
      >
        Sign in to follow
      </Link>
    );
  }
  if (viewerUserId === profileId) {
    return (
      <Link
        href="/onboarding"
        className="self-start whitespace-nowrap rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Edit profile
      </Link>
    );
  }
  return (
    <form action={toggleFollow} className="self-start">
      <input type="hidden" name="profile_id" value={profileId} />
      <input
        type="hidden"
        name="currently_following"
        value={initiallyFollowing ? "1" : "0"}
      />
      <PendingButton
        className={
          initiallyFollowing
            ? "flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 disabled:opacity-70"
            : "flex items-center gap-1.5 whitespace-nowrap rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85 disabled:opacity-70"
        }
      >
        {initiallyFollowing ? "Following" : "Follow"}
      </PendingButton>
    </form>
  );
}
