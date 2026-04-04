import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor, BubbleMenu } from "@tiptap/react";
import { useQuery } from "@tanstack/react-query";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { createSarEditorExtensions } from "./sarEditorExtensions";
import { SarEditorToolbar } from "./SarEditorToolbar";
import { evidenceCycleMapService } from "@/features/business/api/evidenceCycleMap.api";
import { evidenceService } from "@/features/business/api/evidence.api";
import { format } from "date-fns";
import {
  Loader2,
  Bold,
  Italic,
  Underline,
  Link2,
  Trash2,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Minus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  FileDown,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/hooks/useAuth";
import { cn, getFileUrl } from "@/lib/utils";
import { fileService } from "@/features/file/api/uploadfile.api";
import {
  sarService,
  toVietnameseSarMessage,
} from "@/features/business/api/sar.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type {
  SarDraft,
  SarGetListItem,
  SaveSarDraftRequest,
  SarStatus,
} from "@/features/business/types/sar.types";
import type {
  EvidenceCycleMap,
  EvidenceCycleMapGetListPaging,
  EvidenceCycleMapGetListPagingRequest,
} from "@/features/business/types/evidence-cycle-map.types";
import {
  EVIDENCE_TAG_MIME,
  decodeEvidenceTagTransfer,
  encodeEvidenceTagTransfer,
} from "./extensions/EvidenceTag";
import type { TocItem } from "./sarEditorExtensions";
import { isLocalSarAutosaveOrigin } from "./autosave-origin";

interface PopupSarEditorProps {
  open: boolean;
  cycle: SarGetListItem | null;
  draft: SarDraft | null;
  isDraftLoading: boolean;
  isSubmitting: boolean;
  canSubmitByRole?: boolean;
  canEditByRole?: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveDraft: (request: SaveSarDraftRequest) => Promise<boolean>;
  onSubmitSar: (cycleId: string) => Promise<boolean>;
  onRefreshDraft: () => void;
}

const DEFAULT_WS_URL = "ws://localhost:1234";
const DEFAULT_SAR_STATUS: SarStatus = 1;
const PopupEvidenceCycleMap = lazy(
  () =>
    import("@/features/business/routes/EvidenceCycleMap/PopupEvidenceCycleMap"),
);

const SAR_STATUS_META: Record<SarStatus, { label: string; className: string }> =
  {
    1: {
      label: "Nháp",
      className: "bg-slate-100 text-slate-700 border border-slate-300",
    },
    2: {
      label: "Đang chờ duyệt",
      className: "bg-blue-100 text-blue-700 border border-blue-300",
    },
    3: {
      label: "Yêu cầu chỉnh sửa",
      className: "bg-amber-100 text-amber-800 border border-amber-300",
    },
    4: {
      label: "Đã phê duyệt",
      className: "bg-emerald-100 text-emerald-700 border border-emerald-300",
    },
  };

export function isSarEditorReadOnly(status: SarStatus): boolean {
  return status === 2 || status === 4;
}

export function canSubmitSar(
  status: SarStatus,
  canSubmitByRole: boolean,
): boolean {
  return canSubmitByRole && (status === 1 || status === 3);
}

export function shouldShowSarRevisionReasonBanner(
  status: SarStatus,
  revisionReason?: string | null,
): boolean {
  return status === 3 && !!revisionReason?.trim();
}

export function createSarEvidenceListRequest(
  cycleId: string,
): EvidenceCycleMapGetListPagingRequest {
  return {
    PageIndex: 1,
    PageSize: 1000,
    TextSearch: "",
    CycleId: cycleId,
    EvidenceStatus: 3,
  };
}

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

function readStoredBoolean(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return typeof parsed === "boolean" ? parsed : fallback;
  } catch {
    return fallback;
  }
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

function BubbleMenuToolbarButton({
  onClick,
  active,
  icon: Icon,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors",
        active && "bg-blue-100 text-blue-700",
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
  isSubmitting,
  canSubmitByRole = false,
  canEditByRole = false,
  onOpenChange,
  onSaveDraft,
  onSubmitSar,
  onRefreshDraft,
}: PopupSarEditorProps) {
  const providerRef = useRef<WebsocketProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const isPersistingRef = useRef(false);
  const enableAutoSaveTimerRef = useRef<number | null>(null);
  const userColorRef = useRef<string>(
    `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
  );
  const changeVersionRef = useRef(0);
  const lastPersistedVersionRef = useRef(0);
  const hasUnsavedLocalChangesRef = useRef(false);

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [changeVersion, setChangeVersion] = useState(0);
  const [isCollabConnected, setIsCollabConnected] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    readStoredBoolean("sar-editor-sidebar", true),
  );
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(true);
  const [evidenceKeyword, setEvidenceKeyword] = useState("");
  const [evidencePreviewId, setEvidencePreviewId] = useState<string | null>(
    null,
  );
  const [isEvidencePreviewOpen, setIsEvidencePreviewOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorState[]>([]);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isSubmittingFlow, setIsSubmittingFlow] = useState(false);
  const [isSavingLocal, setIsSavingLocal] = useState(false);

  const handleExportDocx = async () => {
    if (!cycle?.CycleId) return;
    setIsExporting(true);
    try {
      const blob = await sarService.exportDocx({ CycleId: cycle.CycleId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAR_${cycle.CycleName || "Export"}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã tải xuống báo cáo");
    } catch (error) {
      toast.error(
        toVietnameseSarMessage(
          error instanceof Error ? error.message : undefined,
          "Xuất báo cáo thất bại",
        ),
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleAutofill = async () => {
    if (!cycle?.CycleId || !editor || isReadOnly) return;
    if (
      !confirm(
        "Thao tác này sẽ chèn thêm nội dung gợi ý vào cuối tài liệu. Bạn có chắc chắn?",
      )
    )
      return;

    setIsAutofilling(true);
    try {
      const res = await sarService.getAutofillPayload({
        CycleId: cycle.CycleId,
      });
      if (res.Success && res.Data) {
        editor.commands.insertContentAt(
          editor.state.doc.content.size,
          res.Data.Payload,
        );
        toast.success("Đã điền dữ liệu gợi ý");
      } else {
        toast.error(
          toVietnameseSarMessage(res.Message, "Lỗi khi lấy dữ liệu gợi ý"),
        );
      }
    } catch (error) {
      toast.error(
        toVietnameseSarMessage(
          error instanceof Error ? error.message : undefined,
          "Lỗi hệ thống khi gọi API Đổ dữ liệu",
        ),
      );
    } finally {
      setIsAutofilling(false);
    }
  };

  const { user } = useAuth();

  const wsUrl =
    (import.meta.env.VITE_SAR_WS_URL as string | undefined)?.trim() ||
    DEFAULT_WS_URL;
  const roomName = useMemo(
    () => (cycle ? `sar_cycle_${cycle.CycleId}` : ""),
    [cycle],
  );
  const draftReportId = draft?.SarReportId ?? null;
  const draftSnapshot = draft?.YDocSnapshotBase64 ?? null;
  const currentStatus = (draft?.Status ??
    cycle?.Status ??
    DEFAULT_SAR_STATUS) as SarStatus;
  const isReadOnly = isSarEditorReadOnly(currentStatus) || !canEditByRole;
  const isEditable = !!ydoc && !isReadOnly;
  const statusMeta =
    SAR_STATUS_META[currentStatus] ?? SAR_STATUS_META[DEFAULT_SAR_STATUS];
  const submitEnabled = canSubmitSar(currentStatus, canSubmitByRole);
  const showRevisionReasonBanner = shouldShowSarRevisionReasonBanner(
    currentStatus,
    draft?.RevisionReason,
  );
  const evidenceRequest = useMemo(
    () => (cycle?.CycleId ? createSarEvidenceListRequest(cycle.CycleId) : null),
    [cycle?.CycleId],
  );
  const { data: evidenceResponse, isFetching: isEvidenceLoading } = useQuery({
    queryKey: ["sar-verified-evidences", cycle?.CycleId],
    queryFn: () => evidenceCycleMapService.getList(evidenceRequest!),
    enabled: open && !!evidenceRequest,
  });
  const verifiedEvidences = evidenceResponse?.Data?.Data ?? [];
  const filteredEvidences = useMemo(() => {
    const keyword = evidenceKeyword.trim().toLowerCase();
    if (!keyword) {
      return verifiedEvidences;
    }

    return verifiedEvidences.filter((evidence) => {
      const code = (evidence.evidenceCode ?? "").toLowerCase();
      const name = (evidence.evidenceName ?? "").toLowerCase();
      return code.includes(keyword) || name.includes(keyword);
    });
  }, [evidenceKeyword, verifiedEvidences]);

  const openEvidencePreview = useCallback((evidenceId: string) => {
    setEvidencePreviewId(evidenceId);
    setIsEvidencePreviewOpen(true);
  }, []);

  const closeEvidencePreview = useCallback((nextOpen: boolean) => {
    setIsEvidencePreviewOpen(nextOpen);
    if (!nextOpen) {
      setEvidencePreviewId(null);
    }
  }, []);

  const {
    data: evidencePreviewResponse,
    isFetching: isEvidencePreviewLoading,
  } = useQuery({
    queryKey: ["sar-evidence-preview", evidencePreviewId],
    queryFn: () => evidenceService.getById(evidencePreviewId!),
    enabled: open && isEvidencePreviewOpen && !!evidencePreviewId,
  });
  const evidencePreview = evidencePreviewResponse?.Data ?? null;
  const evidencePreviewCycleMap = useMemo<EvidenceCycleMap | null>(() => {
    if (!evidencePreview || !cycle?.CycleId) {
      return null;
    }

    return {
      Id: `sar-preview-${evidencePreview.Id}`,
      EvidenceId: evidencePreview.Id,
      CycleId: cycle.CycleId,
      ReviewStatus: 3,
      Evidence: {
        ...evidencePreview,
        CycleId: cycle.CycleId,
      },
      IsEdit: true,
      IsActived: true,
      FolderUpload: evidencePreview.FolderUpload ?? "",
      CreatedBy: evidencePreview.CreatedBy ?? "",
      CreatedAt: evidencePreview.CreatedAt ?? "",
    };
  }, [cycle?.CycleId, evidencePreview]);

  useEffect(() => {
    if (evidenceResponse && !evidenceResponse.Success) {
      toast.error(
        toVietnameseSarMessage(
          evidenceResponse.Message,
          "Không tải được danh sách minh chứng",
        ),
      );
    }
  }, [evidenceResponse]);

  useEffect(() => {
    if (evidencePreviewResponse && !evidencePreviewResponse.Success) {
      toast.error(
        toVietnameseSarMessage(
          evidencePreviewResponse.Message,
          "Không tải được minh chứng",
        ),
      );
    }
  }, [evidencePreviewResponse]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: createSarEditorExtensions(
        ydoc,
        providerRef.current,
        setTocItems,
        ydoc
          ? { name: user?.Fullname ?? "Ẩn danh", color: userColorRef.current }
          : undefined,
      ),
      editorProps: {
        attributes: {
          class: "min-h-[800px] focus:outline-none",
        },
        handleClickOn: (_view, _pos, node, _nodePos, event) => {
          if (node.type.name !== "evidenceTag") {
            return false;
          }

          const evidenceId = String(node.attrs.evidenceId ?? "").trim();
          if (!evidenceId) {
            return false;
          }

          event.preventDefault();
          openEvidencePreview(evidenceId);
          return true;
        },
      },
      editable: isEditable,
    },
    [openEvidencePreview, ydoc, user],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsEvidencePanelOpen(true);
    setEvidenceKeyword("");
  }, [open, cycle?.CycleId]);

  useEffect(() => {
    if (!open) {
      closeEvidencePreview(false);
    }
  }, [closeEvidencePreview, open]);

  useEffect(() => {
    if (!editor || !isEditable) {
      return;
    }

    const dom = editor.view.dom;

    const handleDragOver = (event: DragEvent) => {
      const types = Array.from(event.dataTransfer?.types ?? []);
      if (types.includes(EVIDENCE_TAG_MIME)) {
        event.preventDefault();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = "copy";
        }
      }
    };

    const handleDrop = (event: DragEvent) => {
      const evidence = decodeEvidenceTagTransfer(
        event.dataTransfer?.getData(EVIDENCE_TAG_MIME),
      );

      if (!evidence) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const coords = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });
      const pos = coords?.pos ?? editor.state.selection.from;

      editor
        .chain()
        .focus()
        .insertContentAt(pos, {
          type: "evidenceTag",
          attrs: evidence,
        })
        .run();
    };

    dom.addEventListener("dragover", handleDragOver);
    dom.addEventListener("drop", handleDrop);

    return () => {
      dom.removeEventListener("dragover", handleDragOver);
      dom.removeEventListener("drop", handleDrop);
    };
  }, [editor, isEditable]);

  useEffect(() => {
    if (!open || !cycle || !draftReportId) {
      return;
    }

    if (enableAutoSaveTimerRef.current) {
      window.clearTimeout(enableAutoSaveTimerRef.current);
      enableAutoSaveTimerRef.current = null;
    }

    const doc = new Y.Doc();
    ydocRef.current = doc;

    if (draftSnapshot) {
      try {
        const update = base64ToUint8Array(draftSnapshot);
        Y.applyUpdate(doc, update);
      } catch {
        toast.error("Không thể đọc được dữ liệu bản nháp SAR hiện tại");
      }
    }

    const provider = new WebsocketProvider(wsUrl, roomName, doc);
    providerRef.current = provider;
    provider.on(
      "status",
      (event: { status: "connected" | "disconnected" | "connecting" }) => {
        setIsCollabConnected(event.status === "connected");
      },
    );

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
    changeVersionRef.current = 0;
    lastPersistedVersionRef.current = 0;
    hasUnsavedLocalChangesRef.current = false;
    setChangeVersion(0);
    setIsAutoSaveEnabled(false);
    setLastSavedAt(draft?.LastSavedAt ? new Date(draft.LastSavedAt) : null);

    if (!isReadOnly) {
      enableAutoSaveTimerRef.current = window.setTimeout(() => {
        setIsAutoSaveEnabled(true);
      }, 700);
    }

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
      changeVersionRef.current = 0;
      lastPersistedVersionRef.current = 0;
      hasUnsavedLocalChangesRef.current = false;
      setChangeVersion(0);
      setIsAutoSaveEnabled(false);
    };
  }, [open, cycle?.CycleId, draftReportId, draftSnapshot, roomName, wsUrl]);

  // Set awareness state with full user info (including initials and avatar)
  // This runs AFTER the editor is mounted and CollaborationCursor plugin has initialized
  useEffect(() => {
    if (!editor || !providerRef.current) return;
    providerRef.current.awareness.setLocalStateField("user", {
      name: user?.Fullname ?? "Ẩn danh",
      initials: (user?.Fullname ?? "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      color: userColorRef.current,
      avatar: getFileUrl(user?.Avatar) ?? null,
    });
  }, [editor, user]);

  useEffect(() => {
    if (!ydoc || !isAutoSaveEnabled) {
      return;
    }

    const onUpdate = (_update: Uint8Array, origin: unknown) => {
      if (isLocalSarAutosaveOrigin({ origin }, providerRef.current)) {
        hasUnsavedLocalChangesRef.current = true;
        setChangeVersion((prev) => {
          const next = prev + 1;
          changeVersionRef.current = next;
          return next;
        });
      }
    };

    ydoc.on("update", onUpdate);
    return () => {
      ydoc.off("update", onUpdate);
    };
  }, [ydoc, isAutoSaveEnabled]);

  const waitForPersistIdle = useCallback(async (timeoutMs = 5000) => {
    const startedAt = Date.now();
    while (isPersistingRef.current && Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    return !isPersistingRef.current;
  }, []);

  const persistDraft = useCallback(
    async (mode: "autosave" | "manual", requestedVersion?: number) => {
      if (!cycle || !editor || !ydocRef.current || isReadOnly) {
        return false;
      }

      if (mode === "autosave") {
        const candidateVersion = requestedVersion ?? changeVersionRef.current;
        if (
          !hasUnsavedLocalChangesRef.current ||
          candidateVersion <= lastPersistedVersionRef.current
        ) {
          return true;
        }
      }

      if (isPersistingRef.current) {
        if (mode === "autosave") {
          return false;
        }

        const canContinue = await waitForPersistIdle();
        if (!canContinue || isPersistingRef.current) {
          return false;
        }
      }

      isPersistingRef.current = true;
      setIsSavingLocal(true);
      const versionAtSaveStart = changeVersionRef.current;

      try {
        const yDocSnapshot = Y.encodeStateAsUpdate(ydocRef.current);
        const html = editor.getHTML();

        const success = await onSaveDraft({
          CycleId: cycle.CycleId,
          YDocSnapshotBase64: uint8ToBase64(yDocSnapshot),
          RenderedHtml: html,
        });

        if (success) {
          lastPersistedVersionRef.current = Math.max(
            lastPersistedVersionRef.current,
            versionAtSaveStart,
          );
          hasUnsavedLocalChangesRef.current =
            changeVersionRef.current > lastPersistedVersionRef.current;
          setLastSavedAt(new Date());
        } else if (mode === "manual") {
          toast.error("Lưu bản nháp SAR không thành công");
        }

        return success;
      } finally {
        isPersistingRef.current = false;
        setIsSavingLocal(false);
      }
    },
    [cycle, editor, isReadOnly, onSaveDraft, waitForPersistIdle],
  );

  const debouncedChangeVersion = useDebounce(changeVersion, 800);

  useEffect(() => {
    if (
      !open ||
      isReadOnly ||
      !isAutoSaveEnabled ||
      debouncedChangeVersion === 0
    ) {
      return;
    }

    if (!hasUnsavedLocalChangesRef.current) {
      return;
    }

    if (debouncedChangeVersion <= lastPersistedVersionRef.current) {
      return;
    }

    void persistDraft("autosave", debouncedChangeVersion);
  }, [
    debouncedChangeVersion,
    isAutoSaveEnabled,
    isReadOnly,
    open,
    persistDraft,
  ]);

  useEffect(() => {
    if (!open || isReadOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void persistDraft("manual");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isReadOnly, open, persistDraft]);

  // Handle image paste into editor
  useEffect(() => {
    if (!editor || isReadOnly) return;

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
          toast.error(
            toVietnameseSarMessage(response.Message, "Tải ảnh thất bại"),
            { id: toastId },
          );
        }
      } catch {
        toast.error("Đã xảy ra lỗi khi tải ảnh", { id: toastId });
      }
    };

    dom.addEventListener("paste", handlePaste);
    return () => dom.removeEventListener("paste", handlePaste);
  }, [editor, isReadOnly]);

  const handleSubmit = useCallback(async () => {
    if (
      !cycle ||
      !submitEnabled ||
      isSubmitting ||
      isDraftLoading ||
      isSubmittingFlow
    ) {
      return;
    }

    setIsSubmittingFlow(true);
    try {
      // Collapse any transient editor UI (bubble menus/popovers) before status transition.
      editor?.commands.blur();

      if (!isReadOnly) {
        const saveSucceeded = await persistDraft("manual");
        if (!saveSucceeded) {
          return;
        }
      }

      const success = await onSubmitSar(cycle.CycleId);
      if (!success) {
        toast.error("Gửi SAR phê duyệt không thành công");
        return;
      }

      toast.success("Đã gửi SAR phê duyệt");
      onRefreshDraft();
    } finally {
      setIsSubmittingFlow(false);
    }
  }, [
    cycle,
    isDraftLoading,
    isReadOnly,
    isSubmitting,
    isSubmittingFlow,
    onRefreshDraft,
    onSubmitSar,
    persistDraft,
    submitEnabled,
    editor,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isReadOnly) {
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

  const toggleEvidencePanel = () => {
    setIsEvidencePanelOpen((prev: boolean) => !prev);
  };

  const handleEvidenceDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    evidence: EvidenceCycleMapGetListPaging,
  ) => {
    if (!isEditable) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      EVIDENCE_TAG_MIME,
      encodeEvidenceTagTransfer({
        evidenceId: evidence.EvidenceId,
        evidenceCode: evidence.evidenceCode ?? "",
        evidenceName: evidence.evidenceName ?? undefined,
      }),
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="fixed! top-0! left-0! right-0! bottom-0! w-screen! h-screen! max-w-none! translate-x-0! translate-y-0! rounded-none! p-0! gap-0! border-0 flex flex-col"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Soạn thảo SAR</DialogTitle>
          {/* HEADER */}
          <header className="min-h-[70px] flex items-center px-5 py-2.5 gap-3 border-b bg-white shrink-0 justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => handleOpenChange(false)}
                className="h-7 w-7 shrink-0 flex items-center justify-center text-slate-500 hover:text-slate-700"
                title="Đóng"
              >
                ✕
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[20px] leading-tight font-semibold text-slate-900">
                    Soạn thảo SAR
                  </h1>
                  <span className="text-[20px] leading-tight text-slate-300">
                    /
                  </span>
                  <p className="text-[20px] leading-tight font-semibold text-slate-900 truncate">
                    {cycle?.CycleName || "--"}
                  </p>
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {statusMeta.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 truncate">
                  {cycle?.EvaluationPurpose || "--"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {collaborators.length > 0 && (
                <div className="flex -space-x-2">
                  {collaborators.map((collab, i) =>
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
                    ),
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isCollabConnected ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                <span
                  className={cn(
                    "font-semibold",
                    isCollabConnected ? "text-emerald-600" : "text-amber-700",
                  )}
                >
                  {isSavingLocal
                    ? "Đang lưu..."
                    : isCollabConnected
                      ? "Đã lưu"
                      : "Mất kết nối"}
                </span>
                <span className="text-slate-500">
                  {lastSavedAt ? format(lastSavedAt, "HH:mm:ss") : "--"}
                </span>
              </div>

              {!isReadOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 border-slate-300 text-slate-700 hover:bg-slate-50"
                  disabled={isAutofilling || isDraftLoading}
                  onClick={handleAutofill}
                >
                  {isAutofilling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4 text-purple-500" />
                  )}
                  Đổ dữ liệu
                </Button>
              )}

              {(currentStatus === 2 || currentStatus === 4) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 border-slate-300 text-slate-700 hover:bg-slate-50"
                  disabled={isExporting}
                  onClick={handleExportDocx}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4 text-blue-600" />
                  )}
                  Xuất báo cáo
                </Button>
              )}

              <Button
                size="sm"
                className="h-10 px-5 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  !submitEnabled ||
                  isSubmitting ||
                  isDraftLoading ||
                  isSubmittingFlow
                }
                onClick={() => {
                  void handleSubmit();
                }}
              >
                Gửi Phê duyệt
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* TOOLBAR - 40px */}
          {!isReadOnly && <SarEditorToolbar editor={editor} />}

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
                  <p className="text-xs text-slate-400 italic">
                    Không có heading
                  </p>
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

            <div className="flex flex-1 min-w-0 overflow-hidden bg-slate-100">
              {/* EDITOR AREA */}
              <div className="flex-1 min-w-0 overflow-y-auto py-8 px-6">
                {showRevisionReasonBanner && (
                  <div className="mx-auto mb-4 max-w-[760px] rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p className="font-semibold">Lý do yêu cầu chỉnh sửa</p>
                    <p className="mt-1">{draft?.RevisionReason?.trim()}</p>
                  </div>
                )}
                {!editor ? (
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
                        shouldShow={({ editor }) =>
                          !isReadOnly && !editor.isActive("table")
                        }
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

                    {/* Table Operations BubbleMenu */}
                    {editor && (
                      <BubbleMenu
                        editor={editor}
                        tippyOptions={{ duration: 100 }}
                        shouldShow={({ editor }) =>
                          !isReadOnly && editor.isActive("table")
                        }
                      >
                        <div className="flex items-center gap-1 bg-white border border-slate-200 shadow-lg rounded-lg p-1">
                          {/* Row operations */}
                          <BubbleMenuToolbarButton
                            onClick={() => editor.commands.addRowBefore()}
                            icon={PanelTop}
                            title="Thêm hàng phía trên"
                          />
                          <BubbleMenuToolbarButton
                            onClick={() => editor.commands.addRowAfter()}
                            icon={PanelBottom}
                            title="Thêm hàng phía dưới"
                          />
                          <BubbleMenuToolbarButton
                            onClick={() => editor.commands.deleteRow()}
                            icon={Minus}
                            title="Xóa hàng"
                          />

                          <div className="w-px h-4 bg-slate-200 mx-0.5" />

                          {/* Column operations */}
                          <BubbleMenuToolbarButton
                            onClick={() => editor.commands.addColumnBefore()}
                            icon={PanelLeft}
                            title="Thêm cột phía trái"
                          />
                          <BubbleMenuToolbarButton
                            onClick={() => editor.commands.addColumnAfter()}
                            icon={PanelRight}
                            title="Thêm cột phía phải"
                          />
                          <BubbleMenuToolbarButton
                            onClick={() => editor.commands.deleteColumn()}
                            icon={Minus}
                            title="Xóa cột"
                          />

                          <div className="w-px h-4 bg-slate-200 mx-0.5" />

                          {/* Delete table */}
                          <BubbleMenuToolbarButton
                            onClick={() => {
                              if (
                                confirm(
                                  "Xóa bảng này? Hành động này không thể hoàn tác.",
                                )
                              ) {
                                editor.commands.deleteTable();
                              }
                            }}
                            icon={Trash2}
                            title="Xóa bảng"
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

              {/* RIGHT PANEL */}
              <aside
                className={`border-l bg-white transition-all duration-200 overflow-hidden shrink-0 ${
                  isEvidencePanelOpen ? "w-[320px]" : "w-0"
                }`}
              >
                <div className="h-full min-h-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3 border-b px-3 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Minh chứng
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Kéo thả vào nội dung để chèn thẻ minh chứng
                      </p>
                    </div>
                    <button
                      onClick={toggleEvidencePanel}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Thu gọn panel minh chứng"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="border-b px-3 py-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={evidenceKeyword}
                        onChange={(event) =>
                          setEvidenceKeyword(event.target.value)
                        }
                        placeholder="Tìm theo mã hoặc tên..."
                        className="h-9 pl-8"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3">
                    {isEvidenceLoading ? (
                      <div className="flex h-24 items-center justify-center text-slate-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : filteredEvidences.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        {verifiedEvidences.length === 0
                          ? "Không có minh chứng đã xác minh cho chu kỳ này."
                          : "Không tìm thấy minh chứng khớp từ khóa."}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredEvidences.map((evidence) => (
                          <button
                            key={evidence.EvidenceId}
                            type="button"
                            draggable={isEditable}
                            onDragStart={(event) =>
                              handleEvidenceDragStart(event, evidence)
                            }
                            disabled={!isEditable}
                            className={cn(
                              "w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left shadow-sm transition",
                              isEditable
                                ? "cursor-grab hover:border-blue-300 hover:bg-blue-50/70 active:cursor-grabbing"
                                : "cursor-default opacity-70",
                            )}
                            title={
                              isEditable
                                ? "Kéo thả để chèn vào nội dung"
                                : "Chế độ chỉ đọc"
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                    [{evidence.evidenceCode || "Mã"}]
                                  </span>
                                  <span className="text-[11px] uppercase tracking-wide text-emerald-600">
                                    Đã xác minh
                                  </span>
                                </div>
                                <p className="mt-2 truncate text-sm font-medium text-slate-800">
                                  {evidence.evidenceName ||
                                    "Không có tên minh chứng"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
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

            {!isEvidencePanelOpen && (
              <button
                onClick={toggleEvidencePanel}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-12 min-w-[28px] bg-white border border-r-0 border-slate-200 hover:bg-slate-50 text-slate-600 text-xs flex items-center justify-center rounded-l transition-colors z-20 shadow-sm"
                title="Mở panel minh chứng"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <PopupEvidenceCycleMap
          evidenceCycleMap={evidencePreviewCycleMap}
          isOpen={isEvidencePreviewOpen}
          onOpenChange={closeEvidencePreview}
          saveChange={() => {
            // Read-only preview mode: no save action.
          }}
          onApprove={() => {
            // Read-only preview mode: no approve action.
          }}
          readOnly
          isLoading={isEvidencePreviewLoading}
          isApproving={false}
        />
      </Suspense>
    </>
  );
}
