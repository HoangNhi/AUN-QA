import type { Editor } from "@tiptap/react";

export function findTextRange(
  editor: Editor,
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

export function applyCommentMarkVisualState(
  editorDom: HTMLElement,
  activeCommentId: string | null,
): void {
  const allMarks = editorDom.querySelectorAll<HTMLElement>("span[data-comment-id]");
  allMarks.forEach((element) => {
    element.style.backgroundColor = "";
    element.style.boxShadow = "";
  });

  if (!activeCommentId) {
    return;
  }

  const escapedCommentId =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(activeCommentId)
      : null;

  const activeMarks: HTMLElement[] = escapedCommentId
    ? Array.from(
        editorDom.querySelectorAll<HTMLElement>(`span[data-comment-id="${escapedCommentId}"]`),
      )
    : Array.from(editorDom.querySelectorAll<HTMLElement>("span[data-comment-id]")).filter(
        (candidate) => candidate.getAttribute("data-comment-id") === activeCommentId,
      );

  activeMarks.forEach((element) => {
    element.style.backgroundColor = "rgb(252 211 77)";
    element.style.boxShadow = "0 0 0 2px rgb(245 158 11)";
  });
}
