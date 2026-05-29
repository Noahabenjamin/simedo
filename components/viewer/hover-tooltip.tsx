"use client";

export type HoverInfo = {
  residue: string;
  residueNumber: number;
  chain: string;
  atom: string;
  element: string;
};

type Props = {
  info: HoverInfo;
  x: number;
  y: number;
};

export function HoverTooltip({ info, x, y }: Props) {
  const offsetX = 14;
  const offsetY = 14;

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-2xl border border-border bg-card/90 px-3 py-2 text-xs font-mono text-foreground backdrop-blur-md"
      style={{ left: x + offsetX, top: y + offsetY }}
    >
      <div>
        <span className="text-primary">{info.residue}</span>
        <span className="text-foreground/70"> {info.residueNumber}</span>
        <span className="text-muted-foreground"> · chain {info.chain}</span>
      </div>
      <div className="mt-0.5 text-muted-foreground">
        atom{" "}
        <span className="text-foreground/80">{info.atom}</span>
        <span className="text-muted-foreground/70"> ({info.element})</span>
      </div>
    </div>
  );
}
