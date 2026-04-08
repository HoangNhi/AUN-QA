import { useCallback, useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

export interface CollaboratorState {
  clientId?: number;
  name: string;
  initials: string;
  color: string;
}

export interface UseInternalReviewCollabOptions {
  cycleId?: string;
  reviewRound?: number | null;
  enabled?: boolean;
  onCommentSignal: () => void;
  currentUserFullname?: string | null;
}

function getInitials(fullname?: string | null): string {
  const trimmed = fullname?.trim();
  if (!trimmed) {
    return "?";
  }

  const initials = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();

  return initials || trimmed.slice(0, 2).toUpperCase();
}

function getLocalColor(fullname?: string | null): string {
  const seed = fullname?.trim() || "anonymous";
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const hue = hash % 360;
  return `hsl(${hue} 72% 48%)`;
}

function normalizeCollaboratorState(
  clientId: number,
  state: unknown,
): CollaboratorState | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  const user = (state as { user?: Partial<CollaboratorState> }).user;
  const name = user?.name?.trim();
  const initials = user?.initials?.trim();
  const color = user?.color?.trim();

  if (!name || !initials || !color) {
    return null;
  }

  return {
    clientId,
    name,
    initials,
    color,
  };
}

export function useInternalReviewCollab({
  cycleId,
  reviewRound,
  enabled = true,
  onCommentSignal,
  currentUserFullname,
}: UseInternalReviewCollabOptions) {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const signalMapRef = useRef<Y.Map<unknown> | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorState[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const broadcastCommentChange = useCallback(() => {
    signalMapRef.current?.set("v", {
      at: Date.now(),
      reviewRound: reviewRound ?? null,
    });
  }, [reviewRound]);

  useEffect(() => {
    if (!enabled || !cycleId) {
      return;
    }

    const wsUrl = import.meta.env.VITE_SAR_WS_URL || "ws://localhost:1234";
    const roomName = `internal_review_${cycleId}`;
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    const commentSignalMap = doc.getMap("commentSignal");
    const awareness = provider.awareness;

    docRef.current = doc;
    providerRef.current = provider;
    signalMapRef.current = commentSignalMap;

    const syncCollaborators = () => {
      const nextCollaborators = Array.from(awareness.getStates().entries())
        .filter(([clientId]) => clientId !== awareness.clientID)
        .map(([clientId, state]) => normalizeCollaboratorState(clientId, state))
        .filter((state): state is CollaboratorState => !!state);

      setCollaborators(nextCollaborators);
    };

    const handleStatus = (event: {
      status: "connected" | "connecting" | "disconnected";
    }) => {
      setIsConnected(event.status === "connected");
    };

    const handleCommentSignal = (
      _event: Y.YMapEvent<unknown>,
      transaction: Y.Transaction,
    ) => {
      if (transaction.local) {
        return;
      }

      const signalValue = commentSignalMap.get("v");
      if (typeof signalValue === "object" && signalValue !== null) {
        const signalRound = (signalValue as { reviewRound?: number | null }).reviewRound;
        if (
          typeof signalRound === "number" &&
          typeof reviewRound === "number" &&
          signalRound !== reviewRound
        ) {
          return;
        }
      }

      onCommentSignal();
    };

    provider.on("status", handleStatus);
    awareness.on("change", syncCollaborators);
    commentSignalMap.observe(handleCommentSignal);

    awareness.setLocalStateField("user", {
      name: currentUserFullname?.trim() || "Anonymous",
      initials: getInitials(currentUserFullname),
      color: getLocalColor(currentUserFullname),
    });

    syncCollaborators();

    return () => {
      commentSignalMap.unobserve(handleCommentSignal);
      awareness.off("change", syncCollaborators);
      provider.off("status", handleStatus);

      signalMapRef.current = null;
      providerRef.current = null;
      docRef.current = null;
      setCollaborators([]);
      setIsConnected(false);

      provider.destroy();
      doc.destroy();
    };
  }, [cycleId, currentUserFullname, enabled, onCommentSignal, reviewRound]);

  return {
    collaborators,
    isConnected,
    broadcastCommentChange,
  };
}
