import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { HeaderShell } from "@/components/header-shell";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";
import { WelcomeTour } from "@/components/onboarding/welcome-tour";
import { AnalyticsScript } from "@/components/analytics-script";
import { CommandPalette } from "@/components/search/command-palette";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Inter is used by the studio-style homepage hero only — the rest of the site
// uses Geist Sans. Both variables are exposed on <html> so either can be
// requested via Tailwind utilities or inline styles.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://simedo.work";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Simedo — see molecules in motion",
    template: "%s — Simedo",
  },
  description:
    "An open platform to share, explore, and discuss molecular dynamics simulations.",
  openGraph: {
    siteName: "Simedo",
    type: "website",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <HeaderShell />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <Toaster />
          <WelcomeTour />
          <CommandPalette />
        </ThemeProvider>
        <AnalyticsScript />
      </body>
    </html>
  );
}
