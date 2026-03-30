import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { createSarEditorExtensions } from "./sarEditorExtensions";
import { SarEditorToolbar } from "./SarEditorToolbar";
import { format } from "date-fns";
import { Loader2, Bold, Italic, Underline, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/hooks/useAuth";
import { cn, getFileUrl } from "@/lib/utils";
import { fileService } from "@/features/file/api/uploadfile.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  SarDraft,
  SarGetListItem,
  SaveSarDraftRequest,
} from "@/features/business/types/sar.types";
import type { TocItem } from "./sarEditorExtensions";

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

interface CollaboratorState {
  name: string;
  initials: string;
  color: string;
  avatar: string | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  title?: string;
}

function BubbleMenuToolbarButton({ onClick, active, icon: Icon, title }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors",
        active && "bg-blue-100 text-blue-700"
      )}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export default function PopupSarEditor({
  open,
  cycle,
  draft,
  isDraftLoading,
  isSavingDraft: _isSavingDraft,
  onOpenChange,
  onSaveDraft,
  onRefreshDraft: _onRefreshDraft,
}: PopupSarEditorProps) {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isPersistingRef = useRef(false);
  const enableAutoSaveTimerRef = useRef<number | null>(null);
  const userColorRef = useRef<string>(`hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [changeVersion, setChangeVersion] = useState(0);
  const [isCollabConnected, setIsCollabConnected] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    JSON.parse(localStorage.getItem("sar-editor-sidebar") ?? "true")
  );
  const [collaborators, setCollaborators] = useState<CollaboratorState[]>([]);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  const { user } = useAuth();

  const wsUrl = (import.meta.env.VITE_SAR_WS_URL as string | undefined)?.trim() || DEFAULT_WS_URL;
  const roomName = useMemo(
    () => (cycle ? `sar_cycle_${cycle.CycleId}` : ""),
    [cycle],
  );

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: createSarEditorExtensions(
        ydoc,
        providerRef.current,
        setTocItems,
        ydoc ? { name: user?.Fullname ?? "Ẩn danh", color: userColorRef.current } : undefined,
      ),
      editorProps: {
        attributes: {
          class: "min-h-[800px] focus:outline-none",
        },
      },
      editable: !!ydoc,
    },
    [ydoc, user],
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
        toast.error("Không thể đọc được dữ liệu bản nháp SAR hiện tại");
      }
    }

    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;
    provider.on("status", (event: { status: "connected" | "disconnected" | "connecting" }) => {
      setIsCollabConnected(event.status === "connected");
    });

    // Setup awareness for collaborators
    const awareness = provider.awareness;

    const handleAwarenessChange = () => {
      const states = Array.from(awareness.getStates().entries())
        .filter(([clientId]) => clientId !== awareness.clientID)
        .map(([, state]) => (state.user as CollaboratorState) || {});
      setCollaborators(states.filter((s) => s.name));
    };

    awareness.on("change", handleAwarenessChange);

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

      provider.awareness.off("change", handleAwarenessChange);
      provider.destroy();
      providerRef.current = null;
      setIsCollabConnected(false);
      setCollaborators([]);

      doc.destroy();
      ydocRef.current = null;
      setYdoc(null);
      setChangeVersion(0);
      setIsAutoSaveEnabled(false);
    };
  }, [open, cycle, draft, isDraftLoading, roomName, wsUrl, user]);

  // Set awareness state with full user info (including initials and avatar)
  // This runs AFTER the editor is mounted and CollaborationCursor plugin has initialized
  useEffect(() => {
    if (!editor || !providerRef.current) return;
    providerRef.current.awareness.setLocalStateField('user', {
      name: user?.Fullname ?? "Ẩn danh",
      initials: (user?.Fullname ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
      color: userColorRef.current,
      avatar: getFileUrl(user?.Avatar) ?? null,
    });
  }, [editor, user]);

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
          toast.error("Lưu bản nháp SAR không thành công");
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

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void persistDraft("manual");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, persistDraft]);

  // Handle image paste into editor
  useEffect(() => {
    if (!editor) return;

    const dom = editor.view.dom;

    const handlePaste = async (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      // Prevent Tiptap's default paste handling for this image
      event.stopPropagation();

      const toastId = toast.loading("Đang tải ảnh lên...");
      try {
        const response = await fileService.uploadFileEmbed({
          files: [file],
          folderUpload: "sar",
        });

        if (response.Success && response.Data?.[0]) {
          const url = getFileUrl(response.Data[0].FileUrl);
          if (url) {
            editor.commands.setImage({ src: url });
            toast.dismiss(toastId);
          }
        } else {
          toast.error(response.Message || "Tải ảnh thất bại", { id: toastId });
        }
      } catch {
        toast.error("Đã xảy ra lỗi khi tải ảnh", { id: toastId });
      }
    };

    dom.addEventListener("paste", handlePaste);
    return () => dom.removeEventListener("paste", handlePaste);
  }, [editor]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      void persistDraft("manual");
    }

    onOpenChange(nextOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("sar-editor-sidebar", JSON.stringify(next));
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed! top-0! left-0! right-0! bottom-0! w-screen! h-screen! max-w-none! translate-x-0! translate-y-0! rounded-none! p-0! gap-0! border-0 flex flex-col"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Soạn thảo SAR</DialogTitle>
        {/* HEADER - 52px white */}
        <header className="h-[52px] flex items-center px-4 gap-3 border-b bg-white shrink-0 justify-between">
          <button
            onClick={() => onOpenChange(false)}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700"
            title="Đóng"
          >
            ✕
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-900">
              Soạn thảo SAR — {cycle?.CycleName || "--"}
            </h1>
            <p className="text-xs text-slate-500">
              {cycle?.EvaluationPurpose || "--"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Collaborator avatars */}
            <div className="flex -space-x-2">
              {collaborators.map((collab, i) => (
                collab.avatar ? (
                  <img
                    key={i}
                    src={collab.avatar}
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                    title={collab.name}
                    alt={collab.name}
                  />
                ) : (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white"
                    style={{ background: collab.color }}
                    title={collab.name}
                  >
                    {collab.initials}
                  </div>
                )
              ))}
            </div>

            {/* Realtime badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                isCollabConnected
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCollabConnected ? "bg-green-500" : "bg-amber-500"
                }`}
              />
              {isCollabConnected ? "Đã lưu" : "Mất kết nối"}
            </span>

            {/* Last saved time */}
            <span className="text-xs text-slate-500">
              {lastSavedAt ? format(lastSavedAt, "HH:mm:ss") : "--"}
            </span>

            {/* Submit button */}
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isDraftLoading}
            >
              Gửi Phê duyệt →
            </Button>
          </div>
        </header>

        {/* TOOLBAR - 40px */}
        <SarEditorToolbar editor={editor} />

        {/* BODY - flex row */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* SIDEBAR - collapsible */}
          <aside
            className={`border-r bg-white transition-all duration-200 overflow-hidden shrink-0 ${
              isSidebarOpen ? "w-[220px]" : "w-0"
            }`}
          >
            <div className="p-3 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Cấu trúc
                </p>
                <button
                  onClick={toggleSidebar}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                  title="Đóng sidebar"
                >
                  ←
                </button>
              </div>

              {/* TOC Items */}
              {tocItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có heading</p>
              ) : (
                <nav className="space-y-1">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        item.dom?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                      }
                      className={`w-full text-left text-xs py-1.5 px-2 rounded transition-colors truncate ${
                        item.level === 1 ? "font-semibold" : ""
                      } ${item.level > 1 ? "pl-4" : ""} ${
                        item.isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </aside>

          {/* EDITOR AREA */}
          <div className="flex-1 overflow-y-auto bg-slate-100 py-8 px-6">
            {isDraftLoading || !editor ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="max-w-[760px] mx-auto bg-white shadow-lg rounded border border-slate-200 min-h-[900px] p-16">
                {/* BubbleMenu */}
                {editor && (
                  <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 100 }}
                  >
                    <div className="flex items-center gap-1 bg-white border border-slate-200 shadow-lg rounded-lg p-1">
                      {/* B I U | Link | Clear */}
                      <BubbleMenuToolbarButton
                        onClick={() => editor.commands.toggleBold()}
                        active={editor.isActive("bold")}
                        icon={Bold}
                        title="Đậm"
                      />
                      <BubbleMenuToolbarButton
                        onClick={() => editor.commands.toggleItalic()}
                        active={editor.isActive("italic")}
                        icon={Italic}
                        title="Nghiêng"
                      />
                      <BubbleMenuToolbarButton
                        onClick={() => editor.commands.toggleUnderline()}
                        active={editor.isActive("underline")}
                        icon={Underline}
                        title="Gạch chân"
                      />
                      <div className="w-px h-4 bg-slate-200 mx-0.5" />
                      <BubbleMenuToolbarButton
                        onClick={() => {
                          const url = prompt("Nhập URL:");
                          if (url) editor.commands.setLink({ href: url });
                        }}
                        active={editor.isActive("link")}
                        icon={Link2}
                        title="Liên kết"
                      />
                      <BubbleMenuToolbarButton
                        onClick={() => editor.commands.unsetAllMarks()}
                        icon={Trash2}
                        title="Xóa định dạng"
                      />
                    </div>
                  </BubbleMenu>
                )}

                {/* Editor Content */}
                <EditorContent
                  editor={editor}
                  className="prose prose-sm prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg max-w-none focus:outline-none [&_img]:cursor-pointer [&_img.ProseMirror-selectednode]:outline [&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-blue-500 [&_img.ProseMirror-selectednode]:rounded-sm"
                />
              </div>
            )}
          </div>

          {/* Sidebar toggle when closed */}
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-10 bg-slate-200 hover:bg-slate-300 text-slate-500 text-xs flex items-center justify-center rounded-r transition-colors z-10"
              title="Mở sidebar"
            >
              ›
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
