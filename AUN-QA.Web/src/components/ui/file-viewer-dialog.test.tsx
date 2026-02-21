import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FileViewerDialog from "./file-viewer-dialog";

vi.mock("@/features/file/api/uploadfile.api", () => ({
  fileService: { previewFile: vi.fn() },
}));

describe("FileViewerDialog layout", () => {
  it("uses non-scroll canvas for image", () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 1,
            FullFileName: "x.jpg",
            FileExtension: "jpg",
            FileUrl: "/x.jpg",
          } as any
        }
      />,
    );

    expect(screen.getByTestId("preview-canvas")).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("preview-canvas")).not.toHaveClass(
      "overflow-auto",
    );
  });

  it("keeps scroll canvas for pdf", () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 2,
            FullFileName: "x.pdf",
            FileExtension: "pdf",
            FileUrl: "/x.pdf",
          } as any
        }
      />,
    );

    expect(screen.getByTestId("preview-canvas")).toHaveClass("overflow-auto");
  });
});
