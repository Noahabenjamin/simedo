# Helix

A platform for sharing molecular dynamics simulations. Next.js 16 + Supabase + Anthropic.

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Without env vars, the app runs against in-memory mock data. The AI sidebar shows a configuration-required state. Everything else works.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required for | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Auth + real DB | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + real DB | same |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin ops | same (keep secret) |
| `ANTHROPIC_API_KEY` | AI sidebar | https://console.anthropic.com/settings/keys |
| `R2_ACCOUNT_ID` | Trajectory uploads (Phase 5, stubbed) | Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | same | same |
| `R2_SECRET_ACCESS_KEY` | same | same |
| `R2_BUCKET` | same | same |
| `R2_PUBLIC_URL` | same | same |

## Manual setup checklist

### Supabase (5 min)
1. Create a new project at https://supabase.com/dashboard
2. **Authentication → Providers**: enable Email; enable Google OAuth and paste a Google Cloud OAuth client ID + secret (https://console.cloud.google.com/apis/credentials)
3. **Authentication → URL Configuration**: add `http://localhost:3000` to Site URL, and `http://localhost:3000/auth/callback` to Redirect URLs (also your production URL once deployed)
4. **SQL Editor**: paste and run the migrations in order from `supabase/migrations/` then `supabase/seed.sql`. Or with the CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   psql "<connection-string>" -f supabase/seed.sql
   ```
5. **Project Settings → API**: copy URL, anon key, service-role key into `.env.local`
6. Restart `npm run dev`

### Anthropic (2 min)
1. Go to https://console.anthropic.com/settings/keys
2. Create a key, paste into `.env.local` as `ANTHROPIC_API_KEY`
3. Restart `npm run dev`

### Cloudflare R2 (not needed for Phase 4 — Phase 5 will use it)
Stub only. When ready, follow https://developers.cloudflare.com/r2/api/s3/tokens/ and fill in the R2 env vars above.

### Sentry / Turnstile (not needed for Phase 4)
Stubbed in `lib/sentry.ts` and `lib/turnstile.ts` — replace stubs when ready.

## What's where

```
app/
  (auth pages)          login/, signup/, forgot-password/, onboarding/, auth/callback/
  api/ai/chat           streaming Claude endpoint with tool use
  api/ai/sources        per-simulation source list
  simulation/[id]       viewer + AI sidebar + metadata
  browse, family/[…]    discovery
components/
  ai-sidebar.tsx        the AI guide UI (chat, sources, viewer-driving tools)
  simulation-workspace.tsx   wires viewer ref to AI sidebar
  viewer/*              MolecularViewer (now ref-forwarded for AI control)
lib/
  ai/                   context bundle (PDB+UniProt), prompts, tier router, tools
  auth/                 server actions
  data/                 simulation/family fetchers with mock fallback
  supabase/             client, server, admin
supabase/
  migrations/           init schema, RLS, triggers
  seed.sql              17 sims + 12 fake academic users
SECURITY.md             RLS policy spec
```

## Verifying RLS

See `SECURITY.md` for the manual test plan.

## Notes

- See `SECURITY.md` for the row-level security model.
- Mock data (`lib/mock-data.ts`) is the fallback when Supabase env vars are missing — local dev keeps working.
