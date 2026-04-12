import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ExternalReviewDetail } from "@/features/business/types/externalReview.types";

const WATERMARK_POSITION_LABELS = ["Vát chéo 45°", "Chính giữa", "Lặp lại"];

interface WatermarkTabProps {
  review: ExternalReviewDetail;
  isSubmitting: boolean;
  isReadOnly: boolean;
  onUpdateWatermark: (payload: {
    text?: string | null;
    opacity: number;
    position: number;
  }) => Promise<void>;
}

export function WatermarkTab({
  review,
  isSubmitting,
  isReadOnly,
  onUpdateWatermark,
}: WatermarkTabProps) {
  const [watermarkText, setWatermarkText] = useState<string>(
    review.WatermarkText || "",
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(
    review.WatermarkOpacity ?? 25,
  );
  const [watermarkPosition, setWatermarkPosition] = useState<number>(
    review.WatermarkPosition ?? 0,
  );

  useEffect(() => {
    setWatermarkText(review.WatermarkText || "");
    setWatermarkOpacity(review.WatermarkOpacity ?? 25);
    setWatermarkPosition(review.WatermarkPosition ?? 0);
  }, [review]);

  const disabled = isSubmitting || isReadOnly;

  const handleSave = () => {
    void onUpdateWatermark({
      text: watermarkText.trim() || null,
      opacity: watermarkOpacity,
      position: watermarkPosition,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nội dung Watermark
          </label>
          <Input
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="VD: BẢN MẬT - ĐH ABC - ĐGN 2026"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Độ mờ (Opacity)
            </label>
            <span className="text-xs font-medium text-slate-700">
              {watermarkOpacity}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={watermarkOpacity}
            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
            disabled={disabled}
            className="h-2 w-full cursor-pointer rounded-lg accent-slate-700 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Vị trí
          </label>
          <div className="flex flex-wrap gap-2">
            {WATERMARK_POSITION_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => setWatermarkPosition(i)}
                className={[
                  "rounded-md border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
                  watermarkPosition === i
                    ? "border-slate-700 bg-slate-700 font-medium text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <strong>Tự động nối thêm (không chỉnh được):</strong>
          <br />
          Email chuyên gia · IP · Thời gian xem
        </div>

        {!isReadOnly ? (
          <Button type="button" onClick={handleSave} disabled={disabled}>
            {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview
        </label>
        <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-center text-xs leading-loose text-slate-300 blur-[1px]">
            Văn bản minh chứng
            <br />
            hiển thị tại đây...
          </p>
          <span
            className="pointer-events-none absolute select-none rounded border-4 border-slate-400 px-3 py-1 font-black text-slate-400"
            style={{
              opacity: watermarkOpacity / 100,
              transform: watermarkPosition === 0 ? "rotate(-12deg)" : "none",
              fontSize: "clamp(10px, 2vw, 18px)",
              whiteSpace: "nowrap",
            }}
          >
            {watermarkText || "Watermark preview"}
          </span>
        </div>
      </div>
    </div>
  );
}
