"use client";

import { Pause, Play, Repeat } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];

type Props = {
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  speed: Speed;
  loop: boolean;
  onPlayPause: () => void;
  onScrub: (frame: number) => void;
  onSpeedChange: (s: Speed) => void;
  onLoopChange: (loop: boolean) => void;
};

const iconButtonClass = cn(
  "flex size-8 items-center justify-center rounded-full text-foreground/80",
  "hover:bg-foreground/5 hover:text-foreground transition-colors",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

export function PlaybackBar({
  isPlaying,
  currentFrame,
  totalFrames,
  speed,
  loop,
  onPlayPause,
  onScrub,
  onSpeedChange,
  onLoopChange,
}: Props) {
  return (
    <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-full border border-border bg-card/85 px-3 py-2 backdrop-blur-md">
      <button
        type="button"
        onClick={onPlayPause}
        aria-label={isPlaying ? "Pause" : "Play"}
        className={iconButtonClass}
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current" />
        )}
      </button>

      <div className="flex-1">
        <Slider
          min={0}
          max={Math.max(totalFrames - 1, 0)}
          step={1}
          value={[currentFrame]}
          onValueChange={(v) => onScrub(Array.isArray(v) ? v[0] : v)}
          aria-label="Timeline"
        />
      </div>

      <div className="text-xs font-mono text-muted-foreground tabular-nums min-w-[5.5rem] text-right">
        {currentFrame + 1} / {totalFrames}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Playback speed"
          className={cn(iconButtonClass, "w-auto px-2 text-xs font-mono")}
        >
          {speed}×
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end">
          {SPEEDS.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => onSpeedChange(s)}
              className={cn(
                "cursor-pointer font-mono text-xs",
                speed === s && "text-primary",
              )}
            >
              {s}×
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => onLoopChange(!loop)}
        aria-label="Loop"
        aria-pressed={loop}
        className={cn(
          iconButtonClass,
          loop && "text-primary hover:text-primary",
        )}
      >
        <Repeat className="size-4" />
      </button>
    </div>
  );
}
