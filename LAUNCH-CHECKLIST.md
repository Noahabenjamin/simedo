# Simedo — pre-launch checklist

Status legend: ✅ done · 🟡 half-done · 🔴 not done · ⚪ optional

## 1. Environment variables (Vercel production)

| Variable | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 🟡 | Set locally, must add in Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 🟡 | same |
| `SUPABASE_SERVICE_ROLE_KEY` | 🟡 | Secret — never expose in NEXT_PUBLIC_* |
| `ANTHROPIC_API_KEY` | 🔴 | **The key Noah pasted is a ChatGPT key.** Get a real Anthropic key from https://console.anthropic.com/settings/keys (starts with `sk-ant-…`) |
| `NEXT_PUBLIC_SITE_URL` | 🔴 | Set to `https://simedo.work` once DNS is live |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | 🔴 | e.g. `simedo.work` after creating a Plausible site |
| `ADMIN_USERNAMES` | 🔴 | Your username in seed/profile (comma-separated) — gates `/admin/dashboard` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | 🔴 | Required when Phase 5 (upload) ships |
| `SENTRY_DSN` | ⚪ | Optional — recommended before public launch |

## 2. Supabase production project

- ✅ Migrations written (`supabase/migrations/`)
- 🟡 Local Supabase project: created and migrations run per your message
- 🔴 Production Supabase project: needs to be a separate paid-tier project
- 🔴 Storage bucket `avatars` (public, 1 MB limit) — create in Storage UI
- 🔴 Storage bucket `pdbs` (public, 10 MB limit) — create in Storage UI
- 🔴 Auth → Providers: enable Email + Google. Paste Google OAuth client id/secret
- 🔴 Auth → URL Configuration: set Site URL = `https://simedo.work`; add redirect URLs `https://simedo.work/auth/callback`
- 🔴 Auth → Email Templates: customize the four transactional emails (Confirm signup, Magic link, Password reset, Email change) with Simedo branding
- 🔴 Database → Backups: confirm daily backups are on (paid tier only)
- 🔴 Realtime: enabled by default in new projects — verify under Database → Realtime

## 3. Cloudflare R2

- 🔴 Create bucket `helix-trajectories`
- 🔴 Generate an API token with R/W on the bucket
- 🔴 Set the 5 R2 env vars in Vercel
- 🔴 Implement Phase 5 (upload pipeline) before public users can add content

## 4. DNS

- 🔴 Domain: `simedo.work` (purchased)
- 🔴 Vercel: add `simedo.work` and `www.simedo.work` in Project Settings → Domains
- 🔴 DNS A/CNAME records pointed at Vercel per their wizard
- 🔴 SSL: auto-provisioned by Vercel — verify after DNS propagation

## 5. Seed content + test accounts

- ✅ 17 seed simulations + 12 fake academics in `supabase/seed.sql`
- 🔴 Create a real "Noah" account post-deploy; assign its username to `ADMIN_USERNAMES`
- 🔴 Upload at least 3 real simulations under your own account so the homepage doesn't look entirely seeded
- 🔴 Send 10 personal invites with a one-line note: what Simedo is and what you'd like feedback on

## 6. Manual tests before going public

- 🔴 Sign up via email — confirm email arrives, click link, land on /onboarding
- 🔴 Sign in via Google — confirm callback lands on the destination
- 🔴 Browse to a simulation — confirm viewer loads at <2s on a typical broadband
- 🔴 Ask the AI a question — confirm it streams and cites sources
- 🔴 Click a tool button (Show A:42) — confirm camera animates and residue highlights
- 🔴 Share a sim — confirm copied link opens correctly
- 🔴 Copy embed code — paste into a CodePen, confirm it renders
- 🔴 Open the same sim in two browsers — confirm avatar stack shows both viewers
- 🔴 Test on iPhone Safari, Android Chrome, MacBook Safari, MacBook Chrome, Windows Firefox
- 🔴 Lighthouse: aim for ≥90 on Performance / Accessibility / Best Practices / SEO on `/`, `/browse`, `/simulation/[id]`
- 🔴 Run axe DevTools or WAVE — fix any contrast / aria failures
- 🔴 Verify `prefers-reduced-motion` disables the welcome tour animations and DNA spin

## 7. Transactional emails

Supabase Auth's default emails work but say "Supabase". Customize all four under Auth → Email Templates:

- 🔴 **Confirm signup** — "Welcome to Simedo. Confirm your email to start sharing simulations."
- 🔴 **Magic link** — not used (we use password + Google), but customize anyway in case enabled later
- 🔴 **Password reset** — "Reset your Simedo password"
- 🔴 **Email change** — "Confirm your new Simedo email"

Use the brand color `#0A7C5C` in the email button styles.

## 8. Sentry / error monitoring

- 🔴 Stubbed at `lib/sentry.ts` — replace with real `@sentry/nextjs` initialization
- 🔴 Sentry project + DSN: free tier is enough for soft launch
- 🔴 Wrap `app/api/ai/chat/route.ts` and server actions in `Sentry.captureException` on caught errors
- 🔴 Source-map upload: configure Sentry's Vercel integration so traces are readable

## 9. Backup and disaster recovery

- 🔴 Supabase: confirm daily database backups on (paid tier) — write down the project ref + backup retention window
- 🔴 Test the restore-from-backup flow once on a staging project
- 🔴 R2: object versioning enabled on the bucket so accidental deletes are recoverable for 30 days
- 🔴 Local copy of the `seed.sql` file kept in version control as a content recovery baseline
- 🔴 Document the steps to spin up a replica from scratch (`README.md` already has the setup, expand if needed)

## 10. Launch posts

Drafts below — tighten before posting. None will land unless the product works end-to-end first.

### Hacker News (Show HN)

> **Show HN: Simedo — a YouTube for molecular dynamics simulations**
>
> Hi HN, I'm Noah. I built Simedo because the most beautiful science of our time — proteins moving, DNA twisting, drugs binding — sits in command-line tools that ~nobody outside the field can use.
>
> Simedo is a web platform where researchers share their MD simulations, anyone can watch them in 3D, and an AI guide explains what you're looking at — but only from public sources (RCSB, UniProt, the paper). Every answer cites.
>
> Tech: Next.js, NGL Viewer, Supabase, Claude. Free for browsing. Open beta.
>
> Direct link to a real simulation: https://simedo.work/simulation/cas9-4oo8
>
> Feedback wanted on:
> - Does the AI feel useful or gimmicky?
> - Anything in the upload flow that breaks for your data?
> - What would make this actually useful in your group?

### Reddit (r/biochemistry, r/bioinformatics, r/molecularbiology)

> **A web platform for sharing molecular dynamics trajectories — looking for feedback before public launch**
>
> Hey all — I've been building Simedo for the past few months. It's a place to upload your MD simulations and share them with a link, similar to how Sketchfab does for 3D models. Every simulation has a 3D viewer and an AI guide trained to only answer from public databases (RCSB, UniProt, papers).
>
> Soft launching with 50 invited people next week. If you'd like to be one of them, comment or DM and I'll send a link.

### Twitter / Bluesky

> A home for molecular dynamics simulations, with an AI guide that only cites real sources.
>
> Open beta in a few days → simedo.work
>
> Built with @neonprotocol Anthropic + Supabase + NGL. Looking for ~50 researchers to break it before public launch — reply if you'd like in.

## Caveats

- The product *cannot* soft-launch yet without Phase 5 (upload) — users have nothing to do after signup beyond browsing 17 seed sims. **Build Phase 5 before sending any invites.**
- Comments / likes / follows / search / collections / moderation are all still TODO (Phase 7). Soft launch can proceed without them but the "community" claim is thin until they land.
- Real-time collab is shipped at MVP fidelity: presence + take-control + share button. Live cursors and residue-pulse on click are TODO comments in `components/collab/presence-layer.tsx`.
