import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { createSarEditorExtensions } from "./sarEditorExtensions";
import { format } from "date-fns";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  SarDraft,
  SarGetListItem,
  SaveSarDraftRequest,
} from "@/features/business/types/sar.types";

interface PopupSarEditorProps {
  open: boolean;
  cycle: SarGetListItem | null;
  draft: SarDraft | null;
  isDraftLoading: boolean;
  isSavingDraft: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveDraft: (request: SaveSarDraftRequest) => Promise<boolean>;
  onRefreshDraft: () => void;
}

const DEFAULT_WS_URL = "ws://localhost:1234";

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export default function PopupSarEditor({
  open,
  cycle,
  draft,
  isDraftLoading,
  isSavingDraft,
  onOpenChange,
  onSaveDraft,
  onRefreshDraft,
}: PopupSarEditorProps) {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isPersistingRef = useRef(false);
  const enableAutoSaveTimerRef = useRef<number | null>(null);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [changeVersion, setChangeVersion] = useState(0);
  const [isCollabConnected, setIsCollabConnected] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const wsUrl = (import.meta.env.VITE_SAR_WS_URL as string | undefined)?.trim() || DEFAULT_WS_URL;
  const roomName = useMemo(
    () => (cycle ? `sar_cycle_${cycle.CycleId}` : ""),
    [cycle],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: createSarEditorExtensions(ydoc),
      editorProps: {
        attributes: {
          class:
            "min-h-[calc(100vh-235px)] p-5 focus:outline-none prose prose-sm max-w-none",
        },
      },
      editable: !!ydoc,
    },
    [ydoc],
  );

  useEffect(() => {
    if (!open || !cycle || isDraftLoading) {
      return;
    }

    if (enableAutoSaveTimerRef.current) {
      window.clearTimeout(enableAutoSaveTimerRef.current);
      enableAutoSaveTimerRef.current = null;
    }

    const doc = new Y.Doc();
    ydocRef.current = doc;

    if (draft?.YDocSnapshotBase64) {
      try {
        const update = base64ToUint8Array(draft.YDocSnapshotBase64);
        Y.applyUpdate(doc, update);
      } catch {
        toast.error("Không thé đưỜc dữ liệu bản nháp SAR hiện tại");
      }
    }

    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;
    provider.on("status", (event: { status: "connected" | "disconnected" | "connecting" }) => {
      setIsCollabConnected(event.status === "connected");
    });

    setYdoc(doc);
    setChangeVersion(0);
    setIsAutoSaveEnabled(false);
    setLastSavedAt(draft?.LastSavedAt ? new Date(draft.LastSavedAt) : null);

    enableAutoSaveTimerRef.current = window.setTimeout(() => {
      setIsAutoSaveEnabled(true);
    }, 700);

    return () => {
      if (enableAutoSaveTimerRef.current) {
        window.clearTimeout(enableAutoSaveTimerRef.current);
        enableAutoSaveTimerRef.current = null;
      }

      provider.destroy();
      providerRef.current = null;
      setIsCollabConnected(false);

      doc.destroy();
      ydocRef.current = null;
      setYdoc(null);
      setChangeVersion(0);
      setIsAutoSaveEnabled(false);
    };
  }, [open, cycle, draft, isDraftLoading, roomName, wsUrl]);

  useEffect(() => {
    if (!ydoc || !isAutoSaveEnabled) {
      return;
    }

    const onUpdate = () => {
      setChangeVersion((prev) => prev + 1);
    };

    ydoc.on("update", onUpdate);
    return () => {
      ydoc.off("update", onUpdate);
    };
  }, [ydoc, isAutoSaveEnabled]);

  const persistDraft = useCallback(
    async (mode: "autosave" | "manual") => {
      if (!cycle || !editor || !ydocRef.current) {
        return false;
      }

      if (isPersistingRef.current) {
        return false;
      }

      isPersistingRef.current = true;

      try {
        const yDocSnapshot = Y.encodeStateAsUpdate(ydocRef.current);
        const html = editor.getHTML();

        const success = await onSaveDraft({
          CycleId: cycle.CycleId,
          YDocSnapshotBase64: uint8ToBase64(yDocSnapshot),
          RenderedHtml: html,
        });

        if (success) {
          setLastSavedAt(new Date());
        } else if (mode === "manual") {
          toast.error("Lưu bản nháp SAR không thÃ nh công");
        }

        return success;
      } finally {
        isPersistingRef.current = false;
      }
    },
    [cycle, editor, onSaveDraft],
  );

  const debouncedChangeVersion = useDebounce(changeVersion, 1200);

  useEffect(() => {
    if (!open || !isAutoSaveEnabled || debouncedChangeVersion === 0) {
      return;
    }

    void persistDraft("autosave");
  }, [debouncedChangeVersion, isAutoSaveEnabled, open, persistDraft]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      void persistDraft("manual");
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-screen h-screen max-w-none rounded-none p-0 gap-0 border-0"
        showCloseButton
      >
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle>SAR Editor - {cycle?.CycleName || "--"}</DialogTitle>
              <DialogDescription>
                Room: <span className="font-mono">{roomName || "--"}</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  isCollabConnected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isCollabConnected ? "Đã káº¿t nơ‘i realtime" : "Máº¥t káº¿t nơ‘i realtime"}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshDraft}
                disabled={isDraftLoading}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Tải lại
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  void persistDraft("manual");
                }}
                disabled={isSavingDraft || !editor}
              >
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Lưu ngay
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {lastSavedAt
              ? `Lưu gần nhất: ${format(lastSavedAt, "dd/MM/yyyy HH:mm:ss")}`
              : "Chưa có lần lưu nà o"}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          {isDraftLoading || !editor ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto py-6 px-4 md:px-6">
              <div className="bg-white border rounded-lg shadow-sm">
                <EditorContent editor={editor} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

