"use client";

// Quiet shimmer while NGL initializes and loads the structure. No text —
// the molecule should be the first thing the user sees once it lands.

type Props = { bgColor?: string };

export function ViewerSkeleton({ bgColor }: Props) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: bgColor }}
      aria-busy="true"
      aria-label="Loading molecular viewer"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative size-32 opacity-30">
          <div className="absolute inset-0 animate-pulse rounded-full bg-foreground/10" />
          <div className="absolute inset-4 animate-pulse rounded-full bg-foreground/10 [animation-delay:120ms]" />
          <div className="absolute inset-8 animate-pulse rounded-full bg-foreground/15 [animation-delay:240ms]" />
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/[0.03] to-transparent"
        style={{
          animation: "viewer-shimmer 1.6s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <style>{`
        @keyframes viewer-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
