import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ExternalReviewAccount } from "@/features/business/types/externalReview.types";

interface EditAccountDialogProps {
  open: boolean;
  account: ExternalReviewAccount | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    accountId: string;
    fullname: string;
    username: string;
    email: string;
  }) => Promise<void>;
}

export function EditAccountDialog({
  open,
  account,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: EditAccountDialogProps) {
  const [form, setForm] = useState({
    fullname: "",
    username: "",
    email: "",
  });

  useEffect(() => {
    if (!account) {
      setForm({ fullname: "", username: "", email: "" });
      return;
    }

    setForm({
      fullname: account.Fullname ?? "",
      username: account.Username ?? "",
      email: account.Email ?? "",
    });
  }, [account, open]);

  const canSubmit =
    !!account &&
    form.fullname.trim().length > 0 &&
    form.username.trim().length > 0 &&
    form.email.trim().length > 0;

  const handleSubmit = async () => {
    if (!account) {
      return;
    }

    await onSubmit({
      accountId: account.Id,
      fullname: form.fullname.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[70] max-w-md">
        <DialogTitle>Cập nhật tài khoản Chuyên gia</DialogTitle>

        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Họ tên
            </label>
            <Input
              value={form.fullname}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, fullname: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Tài khoản
            </label>
            <Input
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Email
            </label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button disabled={!canSubmit || isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
