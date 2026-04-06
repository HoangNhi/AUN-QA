import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InternalComment } from "@/features/business/types/internalreview.types";

interface CommentItemProps {
  comment: InternalComment;
  active?: boolean;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (comment: InternalComment) => void;
}

export default function CommentItem({
  comment,
  active = false,
  canDelete = false,
  deleting = false,
  onDelete,
}: CommentItemProps) {
  const createdAtLabel = comment.CreatedAt
    ? format(new Date(comment.CreatedAt), "dd/MM/yyyy HH:mm")
    : "--";

  return (
    <article
      className={`rounded-lg border p-3 transition-colors ${
        active ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-white"
      }`}
      data-comment-id={comment.CommentMarkId ?? comment.Id}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {comment.CreatedByName || comment.CreatedBy}
          </p>
          <p className="text-xs text-slate-500">{createdAtLabel}</p>
        </div>
        {canDelete && onDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-red-600"
            onClick={() => onDelete(comment)}
            disabled={deleting}
            title="Xóa nhận xét"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </header>
      <p className="whitespace-pre-wrap text-sm text-slate-700">{comment.CommentText}</p>
      {comment.HighlightedText ? (
        <p className="mt-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
          "{comment.HighlightedText}"
        </p>
      ) : null}
    </article>
  );
}
