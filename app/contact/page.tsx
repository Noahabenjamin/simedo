import { sendContactMessage } from "@/lib/contact/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Contact — Simedo" };

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6 lg:py-24">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
          Get in touch
        </h1>
        <p className="text-sm text-muted-foreground">
          Bug reports, feature requests, press, partnerships, anything.
        </p>
      </header>

      {params.sent ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            Thanks — message received.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            We&apos;ll reply to the email you provided.
          </p>
        </div>
      ) : (
        <form action={sendContactMessage} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Your email</span>
            <Input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="h-11"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Subject</span>
            <Input name="subject" required className="h-11" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Message</span>
            <Textarea
              name="message"
              required
              rows={6}
              className="resize-none"
            />
          </label>
          {params.error && (
            <p className="text-xs text-destructive">{params.error}</p>
          )}
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Send
          </button>
        </form>
      )}
    </div>
  );
}
