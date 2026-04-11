import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/react";
import { describe, expect, it, vi } from "vitest";
import type { InternalComment } from "@/features/business/types/internalreview.types";
import SarReviewCommentsPanel from "./SarReviewCommentsPanel";

const makeComment = (overrides: Partial<InternalComment> = {}): InternalComment =>
  ({
    Id: "comment-1",
    SarReportId: "sar-1",
    CommentText: "Cần bổ sung nguồn trích dẫn rõ hơn.",
    HighlightedText: "chuẩn đầu ra",
    ReviewRound: 2,
    CreatedAt: "2026-04-10T08:00:00.000Z",
    CreatedBy: "reviewer-1",
    CreatedByName: "Nguyễn Văn A",
    ...overrides,
  }) as InternalComment;

type FakeDescendant = {
  isText: true;
  text: string;
  pos: number;
};

function createEditor(descendants: FakeDescendant[], isDestroyed = false) {
  const focus = vi.fn(() => chainApi);
  const setTextSelection = vi.fn(() => chainApi);
  const scrollIntoView = vi.fn(() => chainApi);
  const run = vi.fn();

  const chainApi = {
    focus,
    setTextSelection,
    scrollIntoView,
    run,
  };

  return {
    isDestroyed,
    state: {
      doc: {
        descendants(callback: (node: FakeDescendant, pos: number) => boolean | void) {
          descendants.forEach((node) => {
            callback(node, node.pos);
          });
        },
      },
    },
    chain: () => chainApi,
  } as unknown as Editor;
}

describe("SarReviewCommentsPanel", () => {
  it("shows the loading state", () => {
    render(
      <SarReviewCommentsPanel
        comments={[]}
        editor={null}
        isLoading
        reviewRound={2}
      />,
    );

    expect(screen.getByTestId("sar-review-panel-loading")).toBeInTheDocument();
    expect(screen.queryByText(/chưa có nhận xét/i)).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no comments", () => {
    render(
      <SarReviewCommentsPanel
        comments={[]}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(screen.getByText(/chưa có nhận xét/i)).toBeInTheDocument();
  });

  it("renders the author and comment text", () => {
    render(
      <SarReviewCommentsPanel
        comments={[makeComment()]}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(screen.getByText("Cần bổ sung nguồn trích dẫn rõ hơn.")).toBeInTheDocument();
  });

  it("renders the highlighted text as a blockquote when present", () => {
    render(
      <SarReviewCommentsPanel
        comments={[makeComment({ HighlightedText: "chuẩn đầu ra" })]}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(screen.getByText("chuẩn đầu ra").closest("blockquote")).toBeInTheDocument();
  });

  it("does not render a blockquote when highlighted text is absent", () => {
    const { container } = render(
      <SarReviewCommentsPanel
        comments={[makeComment({ HighlightedText: null })]}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(container.querySelector("blockquote")).not.toBeInTheDocument();
  });

  it("shows linked comments with a go-to-position action", () => {
    const editor = createEditor([{ isText: true, text: "Giới thiệu chuẩn đầu ra", pos: 5 }]);

    render(
      <SarReviewCommentsPanel
        comments={[makeComment()]}
        editor={editor}
        isLoading={false}
        reviewRound={2}
      />,
    );

    const button = screen.getByRole("button", { name: /đến vị trí/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    const chain = (editor.chain as unknown as () => {
      focus: ReturnType<typeof vi.fn>;
      setTextSelection: ReturnType<typeof vi.fn>;
      scrollIntoView: ReturnType<typeof vi.fn>;
      run: ReturnType<typeof vi.fn>;
    })();

    expect(chain.focus).toHaveBeenCalled();
    expect(chain.setTextSelection).toHaveBeenCalledWith(16);
    expect(chain.scrollIntoView).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it("navigates when clicking a linked comment card", () => {
    const editor = createEditor([{ isText: true, text: "Giới thiệu chuẩn đầu ra", pos: 5 }]);

    render(
      <SarReviewCommentsPanel
        comments={[makeComment()]}
        editor={editor}
        isLoading={false}
        reviewRound={2}
      />,
    );

    const card = screen.getByText("Nguyễn Văn A").closest("article");
    expect(card).toHaveClass("cursor-pointer");
    fireEvent.click(card!);

    const chain = (editor.chain as unknown as () => {
      focus: ReturnType<typeof vi.fn>;
      setTextSelection: ReturnType<typeof vi.fn>;
      scrollIntoView: ReturnType<typeof vi.fn>;
      run: ReturnType<typeof vi.fn>;
    })();

    expect(chain.focus).toHaveBeenCalled();
    expect(chain.setTextSelection).toHaveBeenCalledWith(16);
    expect(chain.scrollIntoView).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it("marks orphaned comments when the highlighted text is missing from the editor", () => {
    const editor = createEditor([{ isText: true, text: "Không khớp", pos: 0 }]);

    render(
      <SarReviewCommentsPanel
        comments={[makeComment()]}
        editor={editor}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(screen.getByText("Đoạn đã được chỉnh sửa")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A").closest("article")).toHaveClass("opacity-60");
  });

  it("omits navigation UI when the editor is null", () => {
    render(
      <SarReviewCommentsPanel
        comments={[makeComment()]}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(screen.queryByRole("button", { name: /đến vị trí/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Đoạn đã được chỉnh sửa")).not.toBeInTheDocument();
  });

  it("shows the review round subtitle", () => {
    render(
      <SarReviewCommentsPanel
        comments={[makeComment()]}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    expect(screen.getByText("Vòng 2 · 1 nhận xét")).toBeInTheDocument();
  });

  it("scrolls the matching comment card into view when activeCommentId changes", async () => {
    if (!HTMLElement.prototype.scrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
        value: () => undefined,
        writable: true,
      });
    }

    const scrollSpy = vi
      .spyOn(HTMLElement.prototype, "scrollIntoView")
      .mockImplementation(() => undefined);

    const comments = [
      makeComment({ Id: "comment-1", CommentMarkId: "mark-1" }),
      makeComment({
        Id: "comment-2",
        CommentMarkId: "mark-2",
        CommentText: "Bình luận thứ hai",
      }),
    ];

    const { rerender } = render(
      <SarReviewCommentsPanel
        comments={comments}
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    rerender(
      <SarReviewCommentsPanel
        comments={comments}
        activeCommentId="mark-2"
        editor={null}
        isLoading={false}
        reviewRound={2}
      />,
    );

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "nearest" });
    });

    scrollSpy.mockRestore();
  });
});
