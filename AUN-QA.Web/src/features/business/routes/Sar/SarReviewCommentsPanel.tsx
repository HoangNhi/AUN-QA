import { useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  findMarkRange,
  findTextRange,
  hasCommentMarkById,
} from "@/features/business/routes/InternalReview/commentEditorUtils";
import type { InternalComment } from "@/features/business/types/internalreview.types";

interface SarReviewCommentsPanelProps {
  comments: InternalComment[];
  editor: Editor | null;
  isLoading: boolean;
  reviewRound?: number | null;
  activeCommentId?: string | null;
  embedded?: boolean;
}

type CommentViewState = "linked" | "orphaned" | "unknown";

type CommentViewModel = {
  comment: InternalComment;
  state: CommentViewState;
  range: { from: number; to: number } | null;
  displayName: string;
};

function getDisplayName(comment: InternalComment): string {
  return comment.CreatedByName?.trim() || comment.CreatedBy?.trim() || "Người dùng";
}

function getCommentViewModel(
  comment: InternalComment,
  editor: Editor | null,
): CommentViewModel {
  const displayName = getDisplayName(comment);
  const highlightedText = comment.HighlightedText?.trim() ?? "";

  if (!editor || editor.isDestroyed) {
    return {
      comment,
      state: "unknown",
      range: null,
      displayName,
    };
  }

  if (comment.CommentMarkId) {
    const isLinked = hasCommentMarkById(editor, comment.CommentMarkId);
    return {
      comment,
      state: isLinked ? "linked" : "orphaned",
      range: isLinked ? findMarkRange(editor, comment.CommentMarkId) : null,
      displayName,
    };
  }

  if (!highlightedText) {
    return {
      comment,
      state: "unknown",
      range: null,
      displayName,
    };
  }

  const range = findTextRange(editor, highlightedText);

  return {
    comment,
    state: range ? "linked" : "orphaned",
    range,
    displayName,
  };
}

export default function SarReviewCommentsPanel({
  comments,
  editor,
  isLoading,
  reviewRound,
  activeCommentId,
  embedded = false,
}: SarReviewCommentsPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const commentViews = useMemo(
    () => comments.map((comment) => getCommentViewModel(comment, editor)),
    [comments, editor],
  );

  useEffect(() => {
    if (!activeCommentId || !scrollContainerRef.current) {
      return;
    }

    const container = scrollContainerRef.current;
    const escapedCommentId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(activeCommentId)
        : null;
    const target = escapedCommentId
      ? container.querySelector<HTMLElement>(`[data-comment-id="${escapedCommentId}"]`)
      : Array.from(container.querySelectorAll<HTMLElement>("[data-comment-id]")).find(
          (candidate) => candidate.getAttribute("data-comment-id") === activeCommentId,
        );

    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeCommentId]);

  const handleGoToLocation = (view: CommentViewModel) => {
    if (!editor || editor.isDestroyed || !view.range) {
      return;
    }

    editor.chain().focus().setTextSelection(view.range.from).scrollIntoView().run();
  };

  const subtitle = isLoading
    ? "Đang tải..."
    : `Vòng ${reviewRound ?? 1} · ${comments.length} nhận xét`;

  return (
    <aside
      className={cn(
        "flex min-h-0 shrink-0 flex-col overflow-hidden bg-slate-50",
        embedded ? "flex-1 w-full" : "h-full w-[320px] border-l",
      )}
    >
      <div className="flex-shrink-0 border-b bg-white px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Nhận xét hội đồng</h3>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div ref={scrollContainerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {isLoading ? (
          <div
            className="flex h-24 items-center justify-center text-slate-400"
            data-testid="sar-review-panel-loading"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-4 text-sm text-slate-500">
            Chưa có nhận xét nào trong vòng này.
          </div>
        ) : (
          commentViews.map((view) => {
            const comment = view.comment;
            const highlightedText = comment.HighlightedText?.trim() ?? "";
            const createdBy = view.displayName;
            const canNavigate =
              !!editor && !editor.isDestroyed && view.state === "linked";

            return (
              <article
                key={comment.Id}
                data-comment-id={comment.CommentMarkId?.trim() || comment.Id}
                className={cn(
                  "rounded-lg border bg-white px-3 py-3 shadow-sm transition-colors",
                  view.state === "linked" ? "border-slate-200" : "border-slate-200",
                  view.state === "orphaned" && "opacity-60",
                  canNavigate && "cursor-pointer",
                )}
                onClick={canNavigate ? () => handleGoToLocation(view) : undefined}
              >
                <header className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {createdBy}
                    </p>
                  </div>

                  {canNavigate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleGoToLocation(view);
                      }}
                    >
                      Đến vị trí
                    </Button>
                  ) : null}
                </header>

                {highlightedText ? (
                  <blockquote
                    className={cn(
                      "mt-2 rounded-r-sm border-l-2 py-1 pl-2 text-xs italic",
                      view.state === "orphaned"
                        ? "border-slate-300 bg-slate-50 text-slate-500"
                        : "border-amber-300 bg-amber-50 text-amber-900",
                    )}
                  >
                    {highlightedText}
                  </blockquote>
                ) : null}

                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                  {comment.CommentText}
                </p>

                {view.state === "orphaned" ? (
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      Đoạn đã được chỉnh sửa
                    </span>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}
