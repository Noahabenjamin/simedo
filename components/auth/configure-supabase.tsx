import { AuthLayout } from "./auth-layout";

// Shown by the auth pages when Supabase env vars aren't set. Stops the page
// from 500'ing while making the next step obvious.
export function ConfigureSupabase() {
  return (
    <AuthLayout title="Authentication isn't configured yet">
      <div className="flex flex-col gap-4 text-sm text-muted-foreground">
        <p>
          Simedo uses Supabase for auth. To enable sign-in locally, set
          these in <code className="font-mono text-foreground">.env.local</code>:
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted px-3 py-2 text-xs">
          NEXT_PUBLIC_SUPABASE_URL=...{"\n"}NEXT_PUBLIC_SUPABASE_ANON_KEY=...
        </pre>
        <p className="text-xs">
          Then restart <code className="font-mono">npm run dev</code>. See the
          README for the full checklist.
        </p>
      </div>
    </AuthLayout>
  );
}
