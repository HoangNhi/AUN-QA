import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FileViewerDialog from "./file-viewer-dialog";
import { fileService } from "@/features/file/api/uploadfile.api";

vi.mock("@/features/file/api/uploadfile.api", () => ({
  fileService: { previewFile: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(fileService.previewFile).mockResolvedValue(new Blob(["x"]));
});

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

  it("renders video wrapper with viewport-safe max height", () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 3,
            FullFileName: "x.mp4",
            FileExtension: "mp4",
            FileUrl: "/x.mp4",
          } as any
        }
      />,
    );

    expect(screen.getByTestId("video-preview-wrapper")).toHaveClass(
      "max-h-full",
    );
  });

  it("renders image preview with viewport-safe max height", async () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 4,
            FullFileName: "y.jpg",
            FileExtension: "jpg",
            FileUrl: "/y.jpg",
          } as any
        }
      />,
    );

    const image = await screen.findByTestId("image-preview");
    expect(image).toHaveClass("max-h-full");
  });
});
