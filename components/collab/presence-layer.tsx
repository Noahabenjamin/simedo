"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Hand } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { MolecularViewerHandle } from "@/components/viewer/molecular-viewer";

// Real-time presence + presenter camera sync for a simulation page.
// Channel: presence:sim:<sim_id>
// - presence: who's here + role (presenter / viewer)
// - broadcast "camera": presenter pushes a camera transform; viewers apply
// - broadcast "request_control": viewer asks; presenter approves
// - broadcast "control_transfer": presenter hands over
//
// Skipped for v1 (TODO comments below): live 3D cursors, residue-pulse on
// click. Both require coordinate mapping that's non-trivial to ship reliably.

type Peer = {
  presenceRef: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  color: string;
  isPresenter: boolean;
};

type Camera = {
  position: [number, number, number];
  rotation: number[];
  zoom: number;
};

const COLOR_POOL = [
  "#0A7C5C",
  "#C2410C",
  "#7C3AED",
  "#0891B2",
  "#BE185D",
  "#65A30D",
];

type Props = {
  simulationId: string;
  viewerRef: React.RefObject<MolecularViewerHandle | null>;
  ownerId: string;
};

export function PresenceLayer({ simulationId, viewerRef, ownerId }: Props) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [isPresenter, setIsPresenter] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<Peer | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastSentCameraRef = useRef<number>(0);

  // Identify the current user (or anonymous guest).
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const id =
        data.user?.id ??
        sessionStorage.getItem("helix.guestId") ??
        crypto.randomUUID();
      if (!data.user) sessionStorage.setItem("helix.guestId", id);
      setMyUserId(id);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Join the presence channel once we have an id.
  useEffect(() => {
    if (!supabase || !myUserId) return;

    const channel = supabase.channel(`presence:sim:${simulationId}`, {
      config: { presence: { key: myUserId } },
    });

    const color =
      COLOR_POOL[Math.abs(hashCode(myUserId)) % COLOR_POOL.length];

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const flat: Peer[] = [];
        for (const ref in state) {
          for (const entry of state[ref] as unknown as Peer[]) {
            flat.push(entry);
          }
        }
        // Sort presenter first.
        flat.sort((a, b) => Number(b.isPresenter) - Number(a.isPresenter));
        setPeers(flat);
        setIsPresenter(
          flat.find((p) => p.userId === myUserId)?.isPresenter ?? false,
        );
      })
      .on(
        "broadcast",
        { event: "camera" },
        ({ payload }: { payload: Camera }) => {
          if (isPresenterRef.current) return;
          applyCameraToViewer(viewerRef.current, payload);
        },
      )
      .on(
        "broadcast",
        { event: "request_control" },
        ({ payload }: { payload: Peer }) => {
          if (!isPresenterRef.current) return;
          setPendingRequest(payload);
        },
      )
      .on(
        "broadcast",
        { event: "control_transfer" },
        ({ payload }: { payload: { newPresenterId: string } }) => {
          const { newPresenterId } = payload;
        // Re-track our own presence with updated isPresenter.
          channel.track({
            presenceRef: myUserId,
            userId: myUserId,
            username: "you",
            displayName: "You",
            color,
            isPresenter: newPresenterId === myUserId,
          });
        },
      );

    channel.subscribe(async (status: string) => {
      if (status !== "SUBSCRIBED") return;
      // Initial presenter: the sim's owner if they're here, else first arrival.
      const initialPresenter = myUserId === ownerId;
      await channel.track({
        presenceRef: myUserId,
        userId: myUserId,
        username: "guest",
        displayName: "Guest",
        color,
        isPresenter: initialPresenter,
      });
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [supabase, myUserId, simulationId, ownerId, viewerRef]);

  // Keep a ref of isPresenter so the broadcast handlers see the current value.
  // The "ref-as-latest-value" pattern intentionally mutates a ref during an
  // effect — the lint flags it, but it's the canonical way to read fresh
  // state from a long-lived subscription handler.
  const isPresenterRef = useRef(isPresenter);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    isPresenterRef.current = isPresenter;
  }, [isPresenter]);

  // Camera broadcasting from presenter — throttled to ~10/sec.
  useEffect(() => {
    if (!isPresenter || !channelRef.current) return;
    const interval = setInterval(() => {
      // Pull the current camera from the stage via a temporary ref hook.
      // The viewer pushes camera updates through onCameraMove — but we don't
      // wire that here to keep the surface narrow. Instead, broadcast on a
      // timer reading the last-known state.
      // TODO(launch): hook onCameraMove → setCameraRef so this is event-driven.
      const cam = lastCameraRef.current;
      if (!cam) return;
      const now = Date.now();
      if (now - lastSentCameraRef.current < 100) return;
      lastSentCameraRef.current = now;
      channelRef.current?.send({
        type: "broadcast",
        event: "camera",
        payload: cam,
      });
    }, 110);
    return () => clearInterval(interval);
  }, [isPresenter]);

  function requestControl() {
    if (!channelRef.current) return;
    const self = peers.find((p) => p.userId === myUserId);
    if (!self) return;
    channelRef.current.send({
      type: "broadcast",
      event: "request_control",
      payload: self,
    });
  }

  function approveControl(peer: Peer) {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "control_transfer",
      payload: { newPresenterId: peer.userId },
    });
    setPendingRequest(null);
  }

  // Solo viewer: nothing useful to show, and the pill was overlapping
  // the viewer's control panel (palette / reset / fullscreen) at top-
  // right. Hide entirely until someone else joins the channel.
  if (!supabase || peers.length <= 1) {
    return null;
  }

  return (
    <>
      <PresenceStack
        peers={peers}
        myUserId={myUserId ?? ""}
        isPresenter={isPresenter}
        onRequestControl={!isPresenter ? requestControl : undefined}
      />
      {pendingRequest && (
        <ControlRequestModal
          peer={pendingRequest}
          onApprove={() => approveControl(pendingRequest)}
          onDeny={() => setPendingRequest(null)}
        />
      )}
    </>
  );
}

const lastCameraRef = { current: null as Camera | null };

function applyCameraToViewer(
  _viewer: MolecularViewerHandle | null,
  _cam: Camera,
): void {
  // TODO(launch): expose camera-apply on the imperative API.
  // For v1, we receive but don't apply — presenter-driven camera sync
  // requires the viewer to expose setCamera(position, rotation, zoom).
  // The presence stack and chat work today; full sync ships next.
}

function PresenceStack({
  peers,
  myUserId,
  isPresenter,
  onRequestControl,
}: {
  peers: Peer[];
  myUserId: string;
  isPresenter: boolean;
  onRequestControl?: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-border bg-card/85 px-2 py-1.5 backdrop-blur-md">
      <div className="flex -space-x-1.5">
        {peers.slice(0, 5).map((p) => (
          <div
            key={p.userId}
            title={`${p.displayName}${p.isPresenter ? " · presenter" : ""}`}
            className="relative"
          >
            <Avatar className="size-7 border-2 border-card">
              <AvatarImage src={p.avatarUrl} alt="" />
              <AvatarFallback
                style={{ backgroundColor: p.color }}
                className="text-[10px] text-white"
              >
                {initials(p.displayName)}
              </AvatarFallback>
            </Avatar>
            {p.isPresenter && (
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-card"
              />
            )}
          </div>
        ))}
      </div>
      {peers.length > 1 && onRequestControl && (
        <button
          type="button"
          onClick={onRequestControl}
          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted-foreground/15"
        >
          <Hand className="size-3" />
          Take control
        </button>
      )}
      {peers.length === 1 && (
        <span className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          you
        </span>
      )}
      {/* Silence unused warnings */}
      {(() => {
        void myUserId;
        void isPresenter;
        return null;
      })()}
    </div>
  );
}

function ControlRequestModal({
  peer,
  onApprove,
  onDeny,
}: {
  peer: Peer;
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-4 top-16 z-30 flex w-72 flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-none"
    >
      <p className="text-sm text-foreground">
        <span className="font-medium">{peer.displayName}</span> wants to take
        control of the viewer.
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDeny}
          className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Deny
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Approve
        </button>
      </div>
    </motion.div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}
