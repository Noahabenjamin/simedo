"use client";

import { Maximize2, Palette, RotateCcw, Shapes } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type Representation =
  | "cartoon"
  | "ball+stick"
  | "surface"
  | "ribbon"
  | "licorice";

export type ColorScheme =
  | "chainname"
  | "residueindex"
  | "sstruc"
  | "element";

const REPRESENTATIONS: { value: Representation; label: string }[] = [
  { value: "cartoon", label: "Cartoon" },
  { value: "ball+stick", label: "Ball + stick" },
  { value: "surface", label: "Surface" },
  { value: "ribbon", label: "Ribbon" },
  { value: "licorice", label: "Licorice" },
];

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: "chainname", label: "By chain" },
  { value: "residueindex", label: "By residue index" },
  { value: "sstruc", label: "By secondary structure" },
  { value: "element", label: "By element" },
];

type Props = {
  representation: Representation;
  colorScheme: ColorScheme;
  onRepresentationChange: (r: Representation) => void;
  onColorSchemeChange: (c: ColorScheme) => void;
  onResetCamera: () => void;
  onFullscreen: () => void;
};

// Pill-shaped icon buttons. Subtle borders, theme-aware, no shadows.
const iconButtonClass = cn(
  "flex size-9 items-center justify-center rounded-full text-foreground/70",
  "hover:bg-foreground/5 hover:text-foreground transition-colors",
  "data-[popup-open]:bg-foreground/5 data-[popup-open]:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

export function ControlPanel({
  representation,
  colorScheme,
  onRepresentationChange,
  onColorSchemeChange,
  onResetCamera,
  onFullscreen,
}: Props) {
  return (
    <div className="absolute right-4 top-4 flex flex-col gap-0.5 rounded-full border border-border bg-card/85 p-1 backdrop-blur-md">
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Representation"
          className={iconButtonClass}
        >
          <Shapes className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" sideOffset={8} align="start">
          {REPRESENTATIONS.map((r) => (
            <DropdownMenuItem
              key={r.value}
              onClick={() => onRepresentationChange(r.value)}
              className={cn(
                "cursor-pointer",
                representation === r.value && "text-primary",
              )}
            >
              {r.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Color scheme"
          className={iconButtonClass}
        >
          <Palette className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" sideOffset={8} align="start">
          {COLOR_SCHEMES.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() => onColorSchemeChange(c.value)}
              className={cn(
                "cursor-pointer",
                colorScheme === c.value && "text-primary",
              )}
            >
              {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={onResetCamera}
        aria-label="Reset camera"
        className={iconButtonClass}
      >
        <RotateCcw className="size-4" />
      </button>

      <button
        type="button"
        onClick={onFullscreen}
        aria-label="Fullscreen"
        className={iconButtonClass}
      >
        <Maximize2 className="size-4" />
      </button>
    </div>
  );
}
