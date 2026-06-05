// Shared footer affordance for the email-confirmation screens.
// Sentence case, no shouting, mailto to the support address Simedo already
// publishes for verification questions.

export function ContactFooter() {
  return (
    <span>
      Need help?{" "}
      <a
        href="mailto:verify@simedo.work"
        className="text-foreground transition-colors hover:text-primary"
      >
        Contact us
      </a>
    </span>
  );
}
