import { useEffect, useRef, useState } from "react";
import { getDocument } from "pdfjs-dist";
import "@/lib/pdf-worker";

interface PdfViewerProps {
  fileUrl: string;
  zoom: number;
}

export function PdfViewer({ fileUrl, zoom }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderPdf = async () => {
      setError(null);
      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = "";

      try {
        const pdf = await getDocument(fileUrl).promise;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale: zoom / 100 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = "mx-auto mb-4 bg-white shadow-sm";

          container.appendChild(canvas);
          await page.render({ canvasContext: context, viewport }).promise;

          if (cancelled) return;
        }
      } catch {
        if (!cancelled) {
          setError("Không thể hiển thị PDF.");
        }
      }
    };

    renderPdf();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, zoom]);

  return (
    <div
      data-testid="pdf-canvas-viewer"
      className="w-full h-full overflow-auto p-4 md:p-6"
    >
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <div ref={containerRef} className="w-full" />
      )}
    </div>
  );
}
