// Embed layout intentionally bypasses the global header and footer.
// Renders only its children inside a full-bleed viewport.

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}
