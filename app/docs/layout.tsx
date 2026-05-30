import { DocsSidebar } from "@/components/docs/sidebar";

export const metadata = {
  title: { default: "Docs", template: "%s — Helix docs" },
  description: "Documentation for Helix: uploading, formats, viewer, and API.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pt-16">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        <aside className="lg:w-[220px] lg:shrink-0">
          <div className="lg:sticky lg:top-20">
            <DocsSidebar />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
