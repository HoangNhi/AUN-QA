import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExternalReviewAccount } from "@/features/business/types/externalReview.types";

interface AccountTabProps {
  externalReviewId?: string;
  accounts: ExternalReviewAccount[];
  isSubmitting: boolean;
  isReadOnly: boolean;
  onCreateAndLinkAccount: (payload: {
    fullname: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onRemoveAccount: (accountId: string) => Promise<void>;
}

const EMPTY_FORM = { fullname: "", username: "", email: "", password: "" };

const FIELDS = [
  { key: "fullname" as const, label: "Họ tên", type: "text" },
  { key: "username" as const, label: "Tên tài khoản", type: "text" },
  { key: "email" as const, label: "Email", type: "text" },
  { key: "password" as const, label: "Mật khẩu", type: "password" },
];

export function AccountTab({
  externalReviewId,
  accounts,
  isSubmitting,
  isReadOnly,
  onCreateAndLinkAccount,
  onRemoveAccount,
}: AccountTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const isFormValid = form.fullname && form.username && form.email && form.password;

  const handleCreate = async () => {
    if (!isFormValid) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      await onCreateAndLinkAccount(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setCreateError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Danh sách tài khoản Chuyên gia (EXT)
          </h3>
          <p className="text-xs text-slate-500">
            {accounts.length} tài khoản đã liên kết
          </p>
        </div>
        {!isReadOnly && externalReviewId ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Thêm chuyên gia
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Họ tên
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tài khoản
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trạng thái
              </th>
              {!isReadOnly ? (
                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thao tác
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.length === 0 ? (
              <tr>
                <td
                  colSpan={isReadOnly ? 3 : 4}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  Chưa có tài khoản chuyên gia nào
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr key={acc.Id || acc.UserId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {acc.Fullname ?? acc.UserId}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {acc.Username ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        acc.IsActived
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          acc.IsActived ? "bg-emerald-500" : "bg-slate-400",
                        ].join(" ")}
                      />
                      {acc.IsActived ? "Đang hoạt động" : "Không hoạt động"}
                    </span>
                  </td>
                  {!isReadOnly ? (
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void onRemoveAccount(acc.Id)}
                        disabled={isSubmitting}
                        className="text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!open) handleCloseForm(); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>Thêm tài khoản Chuyên gia</DialogTitle>

          <div className="space-y-3 pt-1">
            {FIELDS.map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">
                  {label}
                </label>
                <Input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  disabled={isCreating}
                />
              </div>
            ))}

            {createError ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                {createError}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCloseForm}
                disabled={isCreating}
              >
                Hủy
              </Button>
              <Button
                onClick={() => void handleCreate()}
                disabled={isCreating || !isFormValid}
              >
                {isCreating ? "Đang tạo..." : "Tạo tài khoản"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
