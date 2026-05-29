"use server";

import { redirect } from "next/navigation";

// Contact form server action.
// Stubbed: logs to console. Wire to Resend or SendGrid before launch.
// TODO(launch): integrate with a transactional email provider so submissions
// actually arrive at noah@simedo.work.

export async function sendContactMessage(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!email || !subject || !message) {
    redirect("/contact?error=All+fields+are+required.");
  }

  // For now: log it. In prod, send the email.
  console.log("[contact] new message", { email, subject, message });

  redirect("/contact?sent=1");
}
