import { useCallback, useEffect, useMemo, useState } from "react";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CommentExtension from "@sereneinserenade/tiptap-comment-extension";
import { ChevronLeft, ChevronRight, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { internalReviewService } from "@/features/business/api/internalreview.api";
import { useInternalReviewComments } from "@/features/business/hooks/useInternalReviewComments";
import { useInternalReviewCollab } from "@/features/business/hooks/useInternalReviewCollab";
import type { InternalReviewListItem } from "@/features/business/types/internalreview.types";
import { sarService } from "@/features/business/api/sar.api";
import DecisionToolbar from "./components/DecisionToolbar";
import CommentPanel from "./components/CommentPanel";

interface PopupInternalReviewProps {
  open: boolean;
  item: InternalReviewListItem | null;
  onOpenChange: (open: boolean) => void;
  onDataChanged: () => void;
}

interface TocItem {
  text: string;
  level: number;
  pos: number;
}

const DECISION_ROLES = new Set([1]);
const COMMENT_ROLES = new Set([1, 2, 3, 4, 5]);

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addBusinessDays(date: Date, businessDays: number): Date {
  let remaining = businessDays;
  let cursor = startOfDay(date);

  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) {
      remaining -= 1;
    }
  }

  return cursor;
}

function businessDaysUntil(targetDate: Date): number {
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);

  if (today > target) {
    return -1;
  }

  if (today.getTime() === target.getTime()) {
    return 0;
  }

  let count = 0;
  let cursor = today;
  while (cursor < target) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) {
      count += 1;
    }
  }

  return count;
}

function findTextRange(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  text: string,
): { from: number; to: number } | null {
  const normalized = text.trim();
  if (!normalized) {
    return null;
  }

  let range: { from: number; to: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (range || !node.isText || !node.text) {
      return !range;
    }

    const index = node.text.toLowerCase().indexOf(normalized.toLowerCase());
    if (index >= 0) {
      range = {
        from: pos + index,
        to: pos + index + normalized.length,
      };
      return false;
    }

    return true;
  });

  return range;
}

function hasCommentMark(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  commentId: string,
): boolean {
  let found = false;
  editor.state.doc.descendants((node) => {
    if (found) {
      return false;
    }

    found = node.marks.some(
      (mark) => mark.type.name === "comment" && mark.attrs.commentId === commentId,
    );

    return !found;
  });

  return found;
}

export default function PopupInternalReview({
  open,
  item,
  onOpenChange,
  onDataChanged,
}: PopupInternalReviewProps) {
  const { user } = useAuth();
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDecisionLoading, setIsDecisionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const isCommentRealtimeEnabled = open && !!item && item.Status === 2;

  const {
    comments,
    isLoading: isCommentsLoading,
    addComment,
    isAdding,
    deleteComment,
    refetch,
  } = useInternalReviewComments({
    cycleId: item?.CycleId,
    reviewRound: item?.ReviewRound,
    enabled: isCommentRealtimeEnabled,
  });

  const handleCommentSignal = useCallback(() => {
    if (!isCommentRealtimeEnabled) {
      return;
    }

    void refetch();
  }, [isCommentRealtimeEnabled, refetch]);

  const { collaborators, isConnected, broadcastCommentChange } = useInternalReviewCollab({
    cycleId: item?.CycleId,
    reviewRound: item?.ReviewRound,
    enabled: open && !!item,
    onCommentSignal: handleCommentSignal,
    currentUserFullname: user?.Fullname,
  });

  const visibleCollaborators = useMemo(() => collaborators.slice(0, 4), [collaborators]);
  const collaboratorOverflowCount = Math.max(
    collaborators.length - visibleCollaborators.length,
    0,
  );

  const visibleComments = useMemo(
    () => (item?.Status === 2 ? comments : []),
    [comments, item?.Status],
  );

  const handleCommentActivated = useCallback((commentId: string) => {
    const normalizedCommentId = commentId || null;
    setActiveCommentId((prev) => (prev === normalizedCommentId ? prev : normalizedCommentId));
  }, []);

  const editorExtensions = useMemo(
    () => [
      StarterKit,
      CommentExtension.configure({
        HTMLAttributes: {
          class: "rounded-sm bg-amber-200/70 px-0.5 ring-1 ring-amber-300",
        },
        onCommentActivated: handleCommentActivated,
      }),
    ],
    [handleCommentActivated],
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    extensions: editorExtensions,
    content: "",
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[720px] p-8 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (!item?.RenderedHtml) {
      editor.commands.setContent("<p>Không có nội dung SAR để hiển thị.</p>");
      setTocItems([]);
      return;
    }

    editor.commands.setContent(item.RenderedHtml);

    const nextTocItems: TocItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name !== "heading") {
        return true;
      }

      const text = node.textContent.trim();
      if (!text) {
        return true;
      }

      nextTocItems.push({
        text,
        level: typeof node.attrs.level === "number" ? node.attrs.level : 1,
        pos,
      });

      return true;
    });

    setTocItems(nextTocItems);
  }, [editor, item?.RenderedHtml]);

  useEffect(() => {
    if (!editor || !open || isCommentsLoading) {
      return;
    }

    const previousSelection = editor.state.selection;
    const currentCommentIds = new Set(
      visibleComments
        .map((comment) => comment.CommentMarkId?.trim())
        .filter((commentId): commentId is string => !!commentId),
    );
    const staleCommentIds = new Set<string>();

    editor.state.doc.descendants((node) => {
      if (!node.marks.length) {
        return true;
      }

      node.marks.forEach((mark) => {
        if (mark.type.name !== "comment") {
          return;
        }

        const commentId = String(mark.attrs.commentId ?? "").trim();
        if (commentId && !currentCommentIds.has(commentId)) {
          staleCommentIds.add(commentId);
        }
      });

      return true;
    });

    staleCommentIds.forEach((commentId) => {
      editor.commands.unsetComment(commentId);
    });

    let hasAppliedCommentMark = staleCommentIds.size > 0;
    visibleComments.forEach((comment) => {
      if (!comment.CommentMarkId || !comment.HighlightedText) {
        return;
      }

      if (hasCommentMark(editor, comment.CommentMarkId)) {
        return;
      }

      const range = findTextRange(editor, comment.HighlightedText);
      if (!range) {
        return;
      }

      editor.chain().setTextSelection(range).setComment(comment.CommentMarkId).run();
      hasAppliedCommentMark = true;
    });

    if (!hasAppliedCommentMark) {
      return;
    }

    editor
      .chain()
      .setTextSelection({ from: previousSelection.from, to: previousSelection.to })
      .run();
  }, [editor, isCommentsLoading, open, visibleComments]);

  useEffect(() => {
    if (!activeCommentId) {
      return;
    }

    const escapedCommentId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(activeCommentId)
        : null;
    const element = escapedCommentId
      ? document.querySelector(`[data-comment-id="${escapedCommentId}"]`)
      : Array.from(document.querySelectorAll<HTMLElement>("[data-comment-id]")).find(
          (candidate) => candidate.getAttribute("data-comment-id") === activeCommentId,
        );

    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeCommentId]);

  const scrollToHeading = useCallback(
    (pos: number) => {
      if (!editor || editor.isDestroyed || editor.view.isDestroyed) {
        return;
      }

      const docSize = editor.state.doc.content.size;
      if (docSize < 1) {
        return;
      }

      const safePos = Math.min(Math.max(pos, 0), docSize - 1);

      try {
        const { node } = editor.view.domAtPos(safePos + 1);
        const target =
          node instanceof HTMLElement
            ? node
            : node.parentElement instanceof HTMLElement
              ? node.parentElement
              : null;

        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // Ignore invalid positions or stale view state to avoid crashing the popup.
      }
    },
    [editor],
  );

  const roleId = item?.CurrentUserCouncilRoleId ?? null;
  const canComment = !!item && item.Status === 2 && roleId !== null && COMMENT_ROLES.has(roleId);
  const canDecide = !!item && item.Status === 2 && roleId !== null && DECISION_ROLES.has(roleId);

  const statusBadgeClass = useMemo(() => {
    switch (item?.Status) {
      case 1:
        return "bg-slate-100 text-slate-700 border border-slate-300";
      case 2:
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case 3:
        return "bg-amber-100 text-amber-700 border border-amber-300";
      case 4:
        return "bg-emerald-100 text-emerald-700 border border-emerald-300";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-300";
    }
  }, [item?.Status]);

  const statusLabel = useMemo(() => {
    switch (item?.Status) {
      case 1:
        return "Nháp";
      case 2:
        return "Đã nộp";
      case 3:
        return "Yêu cầu chỉnh sửa";
      case 4:
        return "Đã phê duyệt";
      default:
        return "--";
    }
  }, [item?.Status]);

  const remainingDays = useMemo(() => {
    if (!item?.SubmittedAt) {
      return null;
    }
    const dueDate = addBusinessDays(new Date(item.SubmittedAt), 10);
    return businessDaysUntil(dueDate);
  }, [item?.SubmittedAt]);

  const decisionDisabledReason =
    remainingDays !== null && remainingDays > 0
      ? "Chưa đủ 10 ngày làm việc để ra quyết định."
      : null;

  const handleAddComment = async () => {
    if (!editor || !item || !canComment) {
      return;
    }

    const commentText = newCommentText.trim();

    const selection = editor.state.selection;
    const from = selection.from;
    const to = selection.to;
    if (from === to) {
      toast.error("Hãy bôi đen đoạn văn bản trước khi thêm nhận xét.");
      return;
    }

    const highlightedText = editor.state.doc.textBetween(from, to, " ").trim();
    const markId = crypto.randomUUID();

    editor.chain().focus().setComment(markId).run();

    try {
      await addComment({
        CycleId: item.CycleId,
        CommentText: commentText,
        HighlightedText: highlightedText || null,
        CommentMarkId: markId,
      });

      broadcastCommentChange();
      setShowComposer(false);
      setNewCommentText("");
      toast.success("Đã thêm nhận xét.");
      onDataChanged();
    } catch {
      editor.commands.unsetComment(markId);
    }
  };

  const handleDeleteComment = async (commentId: string, markId?: string | null) => {
    setDeletingCommentId(commentId);
    try {
      await deleteComment(commentId);
      if (editor && markId) {
        editor.commands.unsetComment(markId);
      }
      broadcastCommentChange();
      toast.success("Đã xóa nhận xét.");
      onDataChanged();
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleApprove = async () => {
    if (!item) {
      return;
    }

    setIsDecisionLoading(true);
    try {
      const response = await internalReviewService.approveSar({
        CycleId: item.CycleId,
      });

      if (!response.Success) {
        throw new Error(response.Message || "Không thể phê duyệt SAR.");
      }

      toast.success("Đã phê duyệt SAR.");
      onDataChanged();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        (error instanceof Error ? error.message : undefined) ||
          "Không thể phê duyệt SAR.",
      );
    } finally {
      setIsDecisionLoading(false);
    }
  };

  const handleRequestRevision = async (reason: string) => {
    if (!item) {
      return;
    }

    setIsDecisionLoading(true);
    try {
      const response = await internalReviewService.requestRevision({
        CycleId: item.CycleId,
        RevisionReason: reason,
      });

      if (!response.Success) {
        throw new Error(response.Message || "Không thể gửi yêu cầu chỉnh sửa.");
      }

      toast.success("Đã gửi yêu cầu chỉnh sửa.");
      onDataChanged();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        (error instanceof Error ? error.message : undefined) ||
          "Không thể gửi yêu cầu chỉnh sửa.",
      );
    } finally {
      setIsDecisionLoading(false);
    }
  };

  const handleExportDocx = async () => {
    if (!item) {
      return;
    }

    setIsExporting(true);
    try {
      const blob = await sarService.exportDocx({ CycleId: item.CycleId });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `SAR_${item.CycleName}_${item.Year}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Đã xuất file Word.");
    } catch (error) {
      toast.error(
        (error instanceof Error ? error.message : undefined) ||
          "Không thể xuất file Word.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="h-screen w-screen max-w-[100vw] sm:max-w-[100vw] grid-rows-[auto_1fr_auto] gap-0 overflow-hidden rounded-none border-0 p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Internal review</DialogTitle>

        <header className="sticky top-0 z-30 border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {item ? `${item.CycleName} (${item.Year})` : "--"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className={`rounded-full px-3 py-1 font-medium ${statusBadgeClass}`}>
                  {statusLabel}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Vòng {item?.ReviewRound ?? 1}
                </span>
              </div>
              {item?.EvaluationPurpose ? (
                <p className="mt-2 text-sm text-slate-500">{item.EvaluationPurpose}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2"
                title={isConnected ? "Kết nối cộng tác" : "Đang kết nối cộng tác"}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    isConnected ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                {visibleCollaborators.length > 0 ? (
                  <div className="flex -space-x-2">
                    {visibleCollaborators.map((collaborator) => (
                      <Avatar
                        key={collaborator.clientId}
                        className="h-8 w-8 border-2 border-white shadow-sm"
                        style={{ backgroundColor: collaborator.color }}
                        title={collaborator.name}
                      >
                        <AvatarFallback className="bg-transparent text-[11px] font-semibold text-white">
                          {collaborator.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {collaboratorOverflowCount > 0 ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-slate-600 shadow-sm">
                        +{collaboratorOverflowCount}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleExportDocx();
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-1.5 h-4 w-4" />
                )}
                Xuất Word
              </Button>
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
          <aside
            className={`shrink-0 overflow-hidden border-r bg-white transition-all duration-200 ease-in-out ${
              isSidebarOpen ? "w-[220px]" : "w-0 border-r-0"
            }`}
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b px-3 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Mục lục</h3>
                  <p className="text-xs text-slate-500">{tocItems.length} đề mục</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Thu gọn mục lục"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto px-2 py-3">
                {tocItems.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Không có đề mục trong nội dung này.
                  </div>
                ) : (
                  tocItems.map((tocItem) => (
                    <button
                      key={`${tocItem.pos}-${tocItem.text}`}
                      type="button"
                      onClick={() => scrollToHeading(tocItem.pos)}
                      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-slate-100 ${
                        tocItem.level === 1
                          ? "font-semibold text-slate-900"
                          : "font-normal text-slate-600"
                      }`}
                      style={{
                        paddingLeft: `${12 + Math.max(tocItem.level - 1, 0) * 12}px`,
                      }}
                    >
                      {tocItem.text}
                    </button>
                  ))
                )}
              </nav>
            </div>
          </aside>

          {!isSidebarOpen ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="absolute left-0 top-6 z-20 -translate-x-1/2 bg-white shadow-sm"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Mở mục lục"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}

          <div className="flex flex-1 min-w-0 overflow-hidden bg-slate-100">
            <div className="flex-1 min-w-0 overflow-y-auto px-6 py-8">
              {!editor ? (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="mx-auto max-w-[760px] rounded border bg-white shadow-lg">
                  {canComment ? (
                    <BubbleMenu
                      editor={editor}
                      shouldShow={({ from, to }) => from !== to}
                      tippyOptions={{ duration: 120 }}
                    >
                      <div className="space-y-2 rounded-lg border bg-white p-2 shadow-lg">
                        {!showComposer ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowComposer(true)}
                          >
                            + Thêm nhận xét
                          </Button>
                        ) : (
                          <div className="flex w-72 flex-col gap-2">
                            <Input
                              value={newCommentText}
                              onChange={(event) => setNewCommentText(event.target.value)}
                              placeholder="Nhập nội dung nhận xét"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowComposer(false);
                                  setNewCommentText("");
                                }}
                              >
                                Hủy
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  void handleAddComment();
                                }}
                                disabled={isAdding}
                              >
                                Lưu
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </BubbleMenu>
                  ) : null}
                  <EditorContent editor={editor} />
                </div>
              )}
            </div>
          </div>

          <div className="w-[360px] shrink-0">
            <CommentPanel
              comments={visibleComments}
              activeCommentId={activeCommentId}
              currentUsername={user?.Username}
              deletingCommentId={deletingCommentId}
              onDeleteComment={(comment) => {
                void handleDeleteComment(comment.Id, comment.CommentMarkId);
              }}
            />
          </div>
        </div>

        {canDecide ? (
          <DecisionToolbar
            canDecide={!decisionDisabledReason}
            disabledReason={decisionDisabledReason}
            isSubmitting={isDecisionLoading || isCommentsLoading}
            onApprove={handleApprove}
            onRequestRevision={handleRequestRevision}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
