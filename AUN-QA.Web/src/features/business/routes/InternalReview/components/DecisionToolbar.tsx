import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DecisionToolbarProps {
  canDecide: boolean;
  disabledReason?: string | null;
  isSubmitting?: boolean;
  onApprove: () => Promise<void> | void;
  onRequestRevision: (reason: string) => Promise<void> | void;
}

export default function DecisionToolbar({
  canDecide,
  disabledReason,
  isSubmitting = false,
  onApprove,
  onRequestRevision,
}: DecisionToolbarProps) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [reason, setReason] = useState("");
  const trimmedReason = reason.trim();
  const canSubmitRevision = trimmedReason.length >= 20;
  const effectiveDisabledReason =
    !canDecide ? disabledReason ?? "Không đủ điều kiện phê duyệt." : null;

  const revisionHint = useMemo(
    () => `${trimmedReason.length}/20 ký tự`,
    [trimmedReason.length],
  );

  return (
    <>
      <div className="flex items-center justify-end gap-3 border-t bg-white px-6 py-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRevisionOpen(true)}
          disabled={!canDecide || isSubmitting}
          title={effectiveDisabledReason ?? undefined}
        >
          Yêu cầu chỉnh sửa
        </Button>
        <Button
          type="button"
          onClick={() => setApproveOpen(true)}
          disabled={!canDecide || isSubmitting}
          title={effectiveDisabledReason ?? undefined}
        >
          Phê duyệt
        </Button>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận phê duyệt SAR</DialogTitle>
            <DialogDescription>
              Sau khi phê duyệt, SAR sẽ chuyển sang trạng thái đã phê duyệt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={async () => {
                await onApprove();
                setApproveOpen(false);
              }}
              disabled={isSubmitting}
            >
              Xác nhận phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revisionOpen}
        onOpenChange={(open) => {
          setRevisionOpen(open);
          if (!open) {
            setReason("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yêu cầu SAR chỉnh sửa</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do ít nhất 20 ký tự.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={5}
              placeholder="Nhập lý do yêu cầu chỉnh sửa..."
            />
            <p className="text-right text-xs text-slate-500">{revisionHint}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevisionOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={!canSubmitRevision || isSubmitting}
              onClick={async () => {
                await onRequestRevision(trimmedReason);
                setRevisionOpen(false);
                setReason("");
              }}
            >
              Gửi yêu cầu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
