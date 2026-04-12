import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import type { ExternalReviewDetail } from "@/features/business/types/externalReview.types";

const STATUS_OPTIONS = [
  { Value: "0", Text: "Moi tao" },
  { Value: "1", Text: "Dang thuc hien" },
  { Value: "2", Text: "Hoan tat" },
];

const WATERMARK_POSITION_OPTIONS = [
  { Value: "0", Text: "Cheo 45 do" },
  { Value: "1", Text: "Chinh giua" },
  { Value: "2", Text: "Lap lai" },
];

interface WatermarkTabProps {
  review: ExternalReviewDetail;
  isSubmitting: boolean;
  isReadOnly: boolean;
  onUpdateStatus: (status: number) => Promise<void>;
  onUpdateWatermark: (payload: {
    text?: string | null;
    opacity: number;
    position: number;
  }) => Promise<void>;
  onConfirmCompletion: () => Promise<void>;
}

export function WatermarkTab({
  review,
  isSubmitting,
  isReadOnly,
  onUpdateStatus,
  onUpdateWatermark,
  onConfirmCompletion,
}: WatermarkTabProps) {
  const [status, setStatus] = useState<string>(String(review.Status ?? 0));
  const [watermarkText, setWatermarkText] = useState<string>(review.WatermarkText || "");
  const [watermarkOpacity, setWatermarkOpacity] = useState<string>(
    String(review.WatermarkOpacity ?? 25),
  );
  const [watermarkPosition, setWatermarkPosition] = useState<string>(
    String(review.WatermarkPosition ?? 0),
  );

  useEffect(() => {
    setStatus(String(review.Status ?? 0));
    setWatermarkText(review.WatermarkText || "");
    setWatermarkOpacity(String(review.WatermarkOpacity ?? 25));
    setWatermarkPosition(String(review.WatermarkPosition ?? 0));
  }, [review]);

  const disabled = isSubmitting || isReadOnly;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cau hinh trang thai & watermark</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Combobox
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(value) => setStatus(value)}
            placeholder="Chon trang thai"
            searchPlaceholder="Tim trang thai..."
            emptyText="Khong co trang thai."
            disabled={disabled}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void onUpdateStatus(Number(status));
            }}
            disabled={disabled}
          >
            Cap nhat trang thai
          </Button>
          <Button
            type="button"
            onClick={() => {
              void onConfirmCompletion();
            }}
            disabled={disabled || review.IsCompleted}
          >
            {review.IsCompleted ? "Da xac nhan hoan tat" : "Xac nhan hoan tat"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <p className="text-sm font-medium">Noi dung watermark</p>
            <Input
              value={watermarkText}
              onChange={(event) => setWatermarkText(event.target.value)}
              placeholder="Nhap noi dung watermark..."
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Do mo (0-100)</p>
            <Input
              type="number"
              min={0}
              max={100}
              value={watermarkOpacity}
              onChange={(event) => setWatermarkOpacity(event.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <Combobox
            options={WATERMARK_POSITION_OPTIONS}
            value={watermarkPosition}
            onValueChange={(value) => setWatermarkPosition(value)}
            placeholder="Chon vi tri watermark"
            searchPlaceholder="Tim vi tri..."
            emptyText="Khong co vi tri."
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={() => {
              void onUpdateWatermark({
                text: watermarkText.trim() || null,
                opacity: Math.max(0, Math.min(100, Number(watermarkOpacity || 0))),
                position: Number(watermarkPosition || 0),
              });
            }}
            disabled={disabled}
          >
            Luu watermark
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
