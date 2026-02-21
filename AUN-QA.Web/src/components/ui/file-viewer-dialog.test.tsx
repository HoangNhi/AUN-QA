import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("uses non-scroll canvas for pdf to avoid nested scrollbars", () => {
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

    expect(screen.getByTestId("preview-canvas")).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("preview-canvas")).not.toHaveClass(
      "overflow-auto",
    );
  });

  it("renders dedicated pdf scroll container", async () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 5,
            FullFileName: "x.pdf",
            FileExtension: "pdf",
            FileUrl: "/x.pdf",
          } as any
        }
      />,
    );

    expect(await screen.findByTestId("pdf-scroll-container")).toHaveClass(
      "overflow-y-auto",
    );
  });

  it("keeps pdf container within dialog viewport", async () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 6,
            FullFileName: "x.pdf",
            FileExtension: "pdf",
            FileUrl: "/x.pdf",
          } as any
        }
      />,
    );

    const container = await screen.findByTestId("pdf-scroll-container");
    expect(container).toHaveClass("max-h-[85vh]");
    expect(container).toHaveClass("max-w-[95vw]");
  });

  it("applies zoom value to pdf iframe source", async () => {
    render(
      <FileViewerDialog
        isOpen
        onClose={() => {}}
        file={
          {
            Id: 7,
            FullFileName: "x.pdf",
            FileExtension: "pdf",
            FileUrl: "/x.pdf",
          } as any
        }
      />,
    );

    const frame = await screen.findByTitle("x.pdf");
    expect(frame).toHaveAttribute("src", expect.stringContaining("zoom=100"));

    fireEvent.click(screen.getByTitle("Zoom In"));
    expect(await screen.findByTitle("x.pdf")).toHaveAttribute(
      "src",
      expect.stringContaining("zoom=110"),
    );

    fireEvent.click(screen.getByTitle("Zoom Out"));
    expect(await screen.findByTitle("x.pdf")).toHaveAttribute(
      "src",
      expect.stringContaining("zoom=100"),
    );
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
