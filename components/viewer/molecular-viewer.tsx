"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  ControlPanel,
  type ColorScheme,
  type Representation,
} from "./control-panel";
import { PlaybackBar } from "./playback-bar";
import { HoverTooltip, type HoverInfo } from "./hover-tooltip";
import { ViewerSkeleton } from "./viewer-skeleton";

export type AtomClickInfo = {
  resname: string;
  resno: number;
  chainname: string;
  atomname: string;
  element: string;
};

export type CameraState = {
  position: [number, number, number];
  rotation: number[];
  zoom: number;
};

// Imperative methods that callers (AI sidebar, presence layer) can drive.
// Exposed via the `onReady` callback prop rather than forwardRef so that
// next/dynamic + React.lazy reliably pass the handle through.
export type MolecularViewerHandle = {
  focusResidue: (chain: string, residueNumber: number) => void;
  goToFrame: (n: number) => void;
  setRepresentation: (type: Representation) => void;
  highlightSelection: (selectionString: string) => void;
};

type Speed = 0.25 | 0.5 | 1 | 2 | 4;

type Props = {
  pdbUrl: string;
  trajectoryUrl?: string;
  hasTrajectory?: boolean;
  className?: string;
  onReady?: (handle: MolecularViewerHandle) => void;
  onAtomClick?: (info: AtomClickInfo) => void;
  onCameraMove?: (camera: CameraState) => void;
  onFrameChange?: (frame: number) => void;
};

const BG_DARK = "#0e0e0e";
const BG_LIGHT = "#fafafa";

type NglStage = {
  loadFile: (path: string, params?: object) => Promise<NglComponent>;
  signals: {
    hovered: { add: (cb: (p: NglPicking) => void) => void };
    clicked: { add: (cb: (p: NglPicking) => void) => void };
  };
  viewerControls: {
    signals: { changed: { add: (cb: () => void) => void } };
    position: { x: number; y: number; z: number };
    rotation: { elements: ArrayLike<number> };
    distance?: number;
  };
  setParameters: (p: { backgroundColor: string }) => void;
  autoView: (duration?: number) => void;
  handleResize: () => void;
  dispose: () => void;
};

type NglComponent = {
  structure: { modelStore: { count: number } };
  addRepresentation: (
    type: string,
    params?: object,
    hidden?: boolean,
  ) => NglRepresentation;
  removeAllRepresentations: () => void;
  removeRepresentation: (rep: NglRepresentation) => void;
  addTrajectory: (path?: string, params?: object) => NglTrajectory;
  autoView: (sele?: string | number, duration?: number) => void;
};

type NglRepresentation = unknown;

type NglPicking = {
  atom?: {
    resname: string;
    resno: number;
    chainname: string;
    atomname: string;
    element: string;
  };
};

type NglTrajectory = {
  player?: { timeout: number; mode: string; play: () => void; pause: () => void };
  setFrame: (n: number) => void;
  signals: {
    frameChanged: { add: (cb: (n: number) => void) => void };
    gotNumframes: { add: (cb: (n: number) => void) => void };
  };
};

export function MolecularViewer({
  pdbUrl,
  trajectoryUrl,
  hasTrajectory: hasTrajectoryProp,
  className,
  onReady,
  onAtomClick,
  onCameraMove,
  onFrameChange,
}: Props) {
  const { resolvedTheme } = useTheme();
  const bgColor = resolvedTheme === "light" ? BG_LIGHT : BG_DARK;

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<NglStage | null>(null);
  const componentRef = useRef<NglComponent | null>(null);
  const trajRef = useRef<NglTrajectory | null>(null);
  const highlightRepRef = useRef<NglRepresentation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const [representation, setRepresentation] =
    useState<Representation>("cartoon");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("chainname");

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [loop, setLoop] = useState(true);

  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const onAtomClickRef = useRef(onAtomClick);
  const onCameraMoveRef = useRef(onCameraMove);
  const onFrameChangeRef = useRef(onFrameChange);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onAtomClickRef.current = onAtomClick;
    onCameraMoveRef.current = onCameraMove;
    onFrameChangeRef.current = onFrameChange;
    onReadyRef.current = onReady;
  }, [onAtomClick, onCameraMove, onFrameChange, onReady]);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let handleResize: (() => void) | null = null;

    (async () => {
      const NGL = (await import("ngl")) as unknown as {
        Stage: new (el: HTMLElement, params?: object) => NglStage;
      };
      if (cancelled || !containerRef.current) return;

      const stage = new NGL.Stage(containerRef.current, {
        backgroundColor: bgColor,
        cameraType: "perspective",
        quality: "high",
      });
      stageRef.current = stage;

      handleResize = () => stage.handleResize();
      window.addEventListener("resize", handleResize);

      stage.signals.hovered.add((pickingProxy) => {
        if (pickingProxy?.atom) {
          const a = pickingProxy.atom;
          setHoverInfo({
            residue: a.resname,
            residueNumber: a.resno,
            chain: a.chainname,
            atom: a.atomname,
            element: a.element,
          });
        } else {
          setHoverInfo(null);
        }
      });

      stage.signals.clicked.add((pickingProxy) => {
        if (pickingProxy?.atom && onAtomClickRef.current) {
          const a = pickingProxy.atom;
          onAtomClickRef.current({
            resname: a.resname,
            resno: a.resno,
            chainname: a.chainname,
            atomname: a.atomname,
            element: a.element,
          });
        }
      });

      stage.viewerControls.signals.changed.add(() => {
        if (!onCameraMoveRef.current) return;
        const vc = stage.viewerControls;
        onCameraMoveRef.current({
          position: [vc.position.x, vc.position.y, vc.position.z],
          rotation: Array.from(vc.rotation.elements) as number[],
          zoom: typeof vc.distance === "number" ? vc.distance : 0,
        });
      });

      try {
        setIsLoading(true);
        setErrorMessage(null);
        setTotalFrames(0);
        setCurrentFrame(0);
        setIsPlaying(false);

        const component = await stage.loadFile(pdbUrl, {
          defaultRepresentation: false,
        });
        if (cancelled || !component) return;

        componentRef.current = component;
        component.addRepresentation(representation, { colorScheme });
        stage.autoView();

        // Trajectory wiring: prefer an explicit trajectory URL; otherwise,
        // if the PDB itself has multiple models (NMR ensemble or DB-flagged
        // trajectory), animate model-to-model.
        const modelCount = component.structure?.modelStore?.count ?? 0;
        const useExternalTraj = !!trajectoryUrl;
        const useEnsemble =
          !useExternalTraj && modelCount > 1 && hasTrajectoryProp !== false;

        if (useExternalTraj || useEnsemble) {
          const traj = component.addTrajectory(
            useExternalTraj ? trajectoryUrl : undefined,
          );
          trajRef.current = traj;

          traj.signals.frameChanged.add((frame) => {
            setCurrentFrame(frame);
            onFrameChangeRef.current?.(frame);
          });
          traj.signals.gotNumframes.add((n) => setTotalFrames(n));

          // For an in-structure ensemble, NGL doesn't always fire
          // gotNumframes — fall back to the model count.
          if (useEnsemble) setTotalFrames(modelCount);
        }

        setIsLoading(false);

        // Hand the imperative handle to the parent via callback.
        onReadyRef.current?.({
          focusResidue: (chain, residueNumber) => {
            const comp = componentRef.current;
            if (!comp) return;
            const sele = `:${chain} and ${residueNumber}`;
            if (highlightRepRef.current) {
              comp.removeRepresentation(highlightRepRef.current);
            }
            highlightRepRef.current = comp.addRepresentation("ball+stick", {
              sele,
              color: "#1e40af",
              radiusScale: 1.4,
            });
            try {
              comp.autoView(sele, 800);
            } catch {
              stageRef.current?.autoView(800);
            }
          },
          goToFrame: (n) => trajRef.current?.setFrame(n),
          setRepresentation: (type) => setRepresentation(type),
          highlightSelection: (selectionString) => {
            const comp = componentRef.current;
            if (!comp) return;
            if (highlightRepRef.current) {
              comp.removeRepresentation(highlightRepRef.current);
            }
            highlightRepRef.current = comp.addRepresentation("ball+stick", {
              sele: selectionString,
              color: "#1e40af",
              radiusScale: 1.2,
            });
            try {
              comp.autoView(selectionString, 800);
            } catch {
              stageRef.current?.autoView(800);
            }
          },
        });
      } catch (err) {
        console.error("[MolecularViewer] load failed", err);
        setErrorMessage("Couldn't load this structure.");
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (handleResize) window.removeEventListener("resize", handleResize);
      if (stageRef.current) {
        try {
          stageRef.current.dispose();
        } catch {
          // NGL sometimes throws on partial-init dispose
        }
        stageRef.current = null;
        componentRef.current = null;
        trajRef.current = null;
        highlightRepRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdbUrl, trajectoryUrl, retryToken]);

  useEffect(() => {
    if (stageRef.current) {
      stageRef.current.setParameters({ backgroundColor: bgColor });
    }
  }, [bgColor]);

  useEffect(() => {
    const component = componentRef.current;
    if (!component) return;
    component.removeAllRepresentations();
    component.addRepresentation(representation, { colorScheme });
    highlightRepRef.current = null;
  }, [representation, colorScheme]);

  useEffect(() => {
    const traj = trajRef.current;
    if (!traj?.player) return;
    traj.player.timeout = Math.round(50 / speed);
  }, [speed]);

  useEffect(() => {
    const traj = trajRef.current;
    if (!traj?.player) return;
    traj.player.mode = loop ? "loop" : "once";
  }, [loop]);

  const handlePlayPause = useCallback(() => {
    const traj = trajRef.current;
    if (!traj?.player) return;
    if (isPlaying) traj.player.pause();
    else traj.player.play();
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleScrub = useCallback((frame: number) => {
    trajRef.current?.setFrame(frame);
  }, []);

  const handleResetCamera = useCallback(() => {
    stageRef.current?.autoView(800);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen();
  }, []);

  const handleRetry = useCallback(() => setRetryToken((n) => n + 1), []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (totalFrames === 0) return;
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleScrub(Math.min(currentFrame + 1, totalFrames - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleScrub(Math.max(currentFrame - 1, 0));
      }
    },
    [totalFrames, currentFrame, handlePlayPause, handleScrub],
  );

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden focus:outline-none",
        className,
      )}
      style={{ backgroundColor: bgColor }}
      tabIndex={totalFrames > 0 ? 0 : -1}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverInfo(null)}
      onKeyDown={handleKeyDown}
      aria-label="Molecular viewer"
    >
      <div ref={containerRef} className="absolute inset-0" />

      {isLoading && <ViewerSkeleton bgColor={bgColor} />}

      {errorMessage && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          style={{ backgroundColor: bgColor }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="text-sm text-foreground">{errorMessage}</div>
            <div className="text-xs text-muted-foreground font-mono">
              {pdbUrl}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && (
        <>
          <ControlPanel
            representation={representation}
            colorScheme={colorScheme}
            onRepresentationChange={setRepresentation}
            onColorSchemeChange={setColorScheme}
            onResetCamera={handleResetCamera}
            onFullscreen={handleFullscreen}
          />

          {totalFrames > 0 && (
            <PlaybackBar
              isPlaying={isPlaying}
              currentFrame={currentFrame}
              totalFrames={totalFrames}
              speed={speed}
              loop={loop}
              onPlayPause={handlePlayPause}
              onScrub={handleScrub}
              onSpeedChange={(s) => setSpeed(s as Speed)}
              onLoopChange={setLoop}
            />
          )}

          {hoverInfo && hoverPos && (
            <HoverTooltip info={hoverInfo} x={hoverPos.x} y={hoverPos.y} />
          )}
        </>
      )}
    </div>
  );
}

// Default export so next/dynamic can import without the .then(named) dance.
export default MolecularViewer;
