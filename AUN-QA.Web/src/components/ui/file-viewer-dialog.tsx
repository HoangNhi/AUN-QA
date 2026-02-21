import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, XIcon } from "lucide-react";

import { fileService } from "@/features/file/api/uploadfile.api";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import { getFileViewerType } from "@/lib/file-utils";
import { cn, getFileUrl } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog } from "@/components/ui/dialog";
import {
  FileText,
  Image as ImageIcon,
  Film,
  FileSpreadsheet,
  Printer,
  ZoomIn,
  ZoomOut,
  File,
} from "lucide-react";

import { renderAsync } from "docx-preview";
import * as XLSX from "xlsx";
import { ExcelViewer } from "@/components/ui/excel-viewer";

const XLSX_PREVIEW_MAX_ROWS = 100;

interface FileViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: Attachment | null;
  mode?: "internal" | "external";
}

function getFileIcon(type: string, className = "size-5") {
  switch (type) {
    case "excel":
      return <FileSpreadsheet className={`${className} text-emerald-500`} />;
    case "word":
      return <FileText className={`${className} text-blue-500`} />;
    case "pdf":
      return <FileText className={`${className} text-rose-500`} />;
    case "video":
      return <Film className={`${className} text-purple-500`} />;
    case "image":
      return <ImageIcon className={`${className} text-amber-500`} />;
    default:
      return <File className={`${className} text-slate-400`} />;
  }
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  return (kb / 1024).toFixed(1) + " MB";
}

const DocumentShell = ({
  children,
  zoom = 100,
}: {
  children: React.ReactNode;
  zoom?: number;
}) => (
  <div className="bg-[#f8f9fa] w-[850px] max-w-[95vw] max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-white/20 ring-1 ring-black/5">
    {/* Page canvas */}
    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
      <div
        className="bg-white shadow-sm ring-1 ring-zinc-200 min-h-[800px] p-10 md:p-16 mx-auto relative transition-transform duration-300 ease-out origin-top"
        style={{
          transform: `scale(${zoom / 100})`,
          // Add margin when zooming in so it doesn't clip the bottom of the scroll container
          marginBottom: zoom > 100 ? `${(zoom - 100) * 8}px` : "0",
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

const FileViewerDialog = ({
  isOpen,
  onClose,
  file,
  mode = "internal",
}: FileViewerDialogProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [officeBlob, setOfficeBlob] = useState<Blob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const objectUrlRef = useRef<string | null>(null);
  const officeContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when file changes
  useEffect(() => {
    setZoom(100);
  }, [file]);

  useEffect(() => {
    if (isOpen) return;

    setOfficeBlob(null);
    setWorkbook(null);
    setActiveSheet("");

    if (officeContainerRef.current) {
      officeContainerRef.current.innerHTML = "";
    }
  }, [isOpen]);

  const fileExt =
    file?.FileExtension || file?.FullFileName?.split(".").pop()?.toLowerCase();

  const viewerType = useMemo(() => getFileViewerType(fileExt || ""), [fileExt]);
  const shouldUseScrollableCanvas = ["office"].includes(viewerType);

  useEffect(() => {
    if (!isOpen || !file) return;

    let isCancelled = false;

    const loadPreview = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setOfficeBlob(null);
      setWorkbook(null);
      setActiveSheet("");

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setBlobUrl(null);

      try {
        if (viewerType === "video") {
          const directUrl = getFileUrl(file.FileUrl);
          if (!directUrl) {
            throw new Error("Invalid file url");
          }

          if (isCancelled) return;
          setBlobUrl(directUrl);
          return;
        }

        const blob = await fileService.previewFile(file.Id, mode);
        if (isCancelled) return;

        if (viewerType === "office") {
          setOfficeBlob(blob);
          return;
        }

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setBlobUrl(url);
      } catch {
        if (!isCancelled) {
          setErrorMessage("Không thể tải dữ liệu xem trước.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      isCancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [file, isOpen, mode, viewerType]);

  useEffect(() => {
    if (viewerType === "office" && officeBlob) {
      const extension = fileExt?.replace(".", "") || "";

      const renderOfficeFile = async () => {
        setIsLoading(true);
        try {
          if (["docx", "doc"].includes(extension)) {
            // Render docx — needs the DOM ref to be mounted
            if (!officeContainerRef.current) return;
            await renderAsync(
              officeBlob,
              officeContainerRef.current as HTMLElement,
              undefined,
              {
                inWrapper: false,
                ignoreWidth: false,
                ignoreHeight: false,
              },
            );
          } else if (["xlsx", "xls"].includes(extension)) {
            // Parse xlsx — does NOT need a DOM ref
            const buffer = await officeBlob.arrayBuffer();
            const wb = XLSX.read(buffer, {
              type: "array",
              sheetRows: XLSX_PREVIEW_MAX_ROWS,
            });
            setWorkbook(wb);
            setActiveSheet(wb.SheetNames[0]);
            setOfficeBlob(null);
          } else {
            if (officeContainerRef.current) {
              officeContainerRef.current.innerHTML = `
                <div class="h-full w-full flex items-center justify-center text-center px-8 text-sm text-gray-600">
                  Định dạng Office này chưa hỗ trợ xem trực tiếp. Vui lòng tải tệp xuống để xem nội dung.
                </div>
              `;
            }
          }
        } catch (error) {
          console.error("Office Preview Error", error);
          if (officeContainerRef.current) {
            officeContainerRef.current.innerHTML = `
              <div class="h-full w-full flex items-center justify-center text-center px-8 text-sm text-red-500">
                Lỗi khi hiển thị dữ liệu xem trước Office.
              </div>
            `;
          }
        } finally {
          setIsLoading(false);
        }
      };

      renderOfficeFile();
    }
  }, [officeBlob, viewerType, fileExt]);

  const handleDownload = async () => {
    if (!file) return;

    try {
      if (viewerType === "video") {
        const directUrl = getFileUrl(file.FileUrl);
        if (!directUrl) throw new Error("Invalid file url");

        const link = document.createElement("a");
        link.href = directUrl;
        link.download = file.FullFileName || "download";
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      // If we already fetched the blob, use the blob url
      if (blobUrl) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = file.FullFileName || "download";
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const blob = await fileService.previewFile(file.Id, mode);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.FullFileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setErrorMessage("Không thể tải tệp xuống.");
    }
  };

  const renderContent = () => {
    if (isLoading && (!officeBlob || viewerType !== "office")) {
      return (
        <div className="flex flex-col items-center justify-center text-sm text-zinc-400 gap-4 h-full">
          <Loader2 className="size-8 animate-spin text-zinc-500" />
          <p>Đang tải tệp xem trước...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 flex flex-col items-center text-center text-white ring-1 ring-white/10 max-w-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <File className="size-16 text-rose-500 mb-4" />
          <h4 className="text-lg font-medium mb-2">Lỗi tải tệp</h4>
          <p className="text-zinc-400 text-sm">{errorMessage}</p>
        </div>
      );
    }

    if (!blobUrl && viewerType !== "office") {
      return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 flex flex-col items-center text-center text-white ring-1 ring-white/10 max-w-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <File className="size-16 text-zinc-500 mb-4" />
          <h4 className="text-lg font-medium mb-2">Không có dữ liệu gốc</h4>
          <p className="text-zinc-400 text-sm">
            Tệp này không tồn tại hoặc đã bị xóa.
          </p>
        </div>
      );
    }

    if (viewerType === "pdf") {
      const pdfHash = `#toolbar=0&navpanes=0&view=FitH&zoom=${zoom}`;

      return (
        <div
          data-testid="pdf-scroll-container"
          className="w-full max-w-[95vw] h-full max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          <iframe
            src={blobUrl! + pdfHash}
            title={file?.FullFileName}
            className="w-full min-h-[85vh] border-0 bg-transparent"
          />
        </div>
      );
    }

    if (viewerType === "image") {
      return (
        <img
          data-testid="image-preview"
          src={blobUrl!}
          alt={file?.FullFileName}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center",
          }}
        />
      );
    }

    if (viewerType === "video") {
      return (
        <div
          data-testid="video-preview-wrapper"
          className="w-full max-w-5xl max-h-full rounded-2xl overflow-hidden bg-black shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
        >
          <video
            controls
            src={blobUrl!}
            className="w-full max-h-full aspect-video object-contain"
            autoPlay
          />
        </div>
      );
    }

    if (viewerType === "office") {
      const isExcel = ["xlsx", "xls"].includes(fileExt?.replace(".", "") || "");

      if (isExcel) {
        if (isLoading || !workbook) {
          return (
            <div className="flex flex-col items-center justify-center text-sm text-zinc-400 gap-4 h-full">
              <Loader2 className="size-8 animate-spin text-zinc-500" />
              <p>Đang phân tích bảng tính...</p>
            </div>
          );
        }

        return (
          <div className="w-full h-full max-w-[95vw] max-h-[85vh]">
            <ExcelViewer
              workbook={workbook}
              activeSheet={activeSheet}
              onSheetChange={setActiveSheet}
              zoom={zoom}
            />
          </div>
        );
      }

      // Word / other office — keep existing DocumentShell + officeContainerRef
      return (
        <DocumentShell zoom={zoom}>
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center text-sm text-gray-600 font-medium gap-3">
              <Loader2 className="size-8 animate-spin text-blue-500" />
              <p>Đang vẽ tài liệu...</p>
            </div>
          )}
          <div
            ref={officeContainerRef}
            className="w-full overflow-x-auto text-sm text-left text-slate-800"
          />
        </DocumentShell>
      );
    }

    return (
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 flex flex-col items-center text-center text-white ring-1 ring-white/10 max-w-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <File className="size-16 text-zinc-500 mb-4" />
        <h4 className="text-lg font-medium mb-2">Không có bản xem trước</h4>
        <p className="text-zinc-400 text-sm">
          Định dạng tệp này không được hỗ trợ xem trực tiếp. Vui lòng tải xuống
          để xem nội dung.
        </p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* A dark translucent blur background */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col pointer-events-auto bg-transparent focus:outline-none">
          {/* Screen-reader title (visually hidden — visual title is in the header bar) */}
          <DialogPrimitive.Title className="sr-only">
            {file?.FullFileName ?? "Xem trước tệp"}
          </DialogPrimitive.Title>

          {/* Sleek Header */}
          <div className="flex items-center justify-between px-4 h-16 bg-gradient-to-b from-black/50 to-transparent shrink-0 relative z-10 w-full">
            <div className="flex items-center gap-4 text-white">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                {getFileIcon(viewerType, "size-5")}
              </div>
              <div>
                <h3 className="font-medium text-[15px] truncate max-w-[300px] md:max-w-md">
                  {file?.FullFileName || "Unnamed file"}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                  <span className="uppercase tracking-wider">
                    {fileExt || "unknown"}{" "}
                    {viewerType !== "video" &&
                    viewerType !== "office" &&
                    viewerType !== "image"
                      ? ""
                      : `- ${viewerType}`}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                  <span>{formatFileSize(file?.FileSize)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom controls for documents/images, hid for video */}
              {["office", "image", "pdf"].includes(viewerType) && (
                <div className="hidden md:flex items-center gap-1 bg-white/10 rounded-lg p-1 mr-4 backdrop-blur-md">
                  <button
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                  <span className="text-xs font-medium text-zinc-300 w-12 text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(200, z + 10))}
                    className="p-1.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="size-4" />
                  </button>
                </div>
              )}

              {/* Print Button Wrapper */}
              {["office", "image", "pdf"].includes(viewerType) && (
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-md cursor-not-allowed"
                >
                  <Printer className="size-4" />
                  <span className="hidden sm:inline">In</span>
                </button>
              )}

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-md"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Tải xuống</span>
              </button>

              <div className="w-px h-6 bg-white/20 mx-1"></div>

              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <XIcon className="size-5" />
              </button>
            </div>
          </div>

          {/* Main Canvas Area */}
          <div
            data-testid="preview-canvas"
            className={cn(
              "flex-1 flex items-center justify-center relative p-4 md:p-8",
              shouldUseScrollableCanvas ? "overflow-auto" : "overflow-hidden",
            )}
          >
            {renderContent()}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
};

export default FileViewerDialog;
