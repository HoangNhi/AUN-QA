import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { useCycleOptions } from "@/features/business/hooks/useCycleOptions";
import { actionPlanService } from "@/features/business/api/actionPlan.api";
import { useActionPlan } from "./hooks/useActionPlan";
import type {
  ActionPlanDetail,
  ActionPriority,
  ActionPlanStatus,
  ExternalFindingOption,
} from "@/features/business/types/actionPlan.types";
import { getActionPlanStatusLabel } from "./actionPlan.utils";

interface PopupActionPlanProps {
  open: boolean;
  item: ActionPlanDetail | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

function parseDateInput(value: string | undefined | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default function PopupActionPlan({
  open,
  item,
  onOpenChange,
  onChanged,
}: PopupActionPlanProps) {
  const { savePlan, submitPlan, approvePlan, requestRevision, assignPlan, isMutating } =
    useActionPlan();
  const cycleOptions = useCycleOptions(open);

  const [form, setForm] = useState({
    Id: item?.Id ?? "00000000-0000-0000-0000-000000000000",
    CycleId: item?.CycleId ?? "",
    Title: item?.Title ?? "",
    Description: item?.Description ?? "",
    StandardId: item?.StandardId ?? "",
    CriterionId: item?.CriterionId ?? "",
    Priority: String(item?.Priority ?? 2),
    Deadline: parseDateInput(item?.Deadline),
    Kpi: item?.Kpi ?? "",
    SourceFindingId: item?.SourceFindingId ?? "",
    AssignedTo: item?.Assignees?.map((x) => x.UserId).join(", ") ?? "",
    RevisionReason: item?.RevisionReason ?? "",
  });

  useEffect(() => {
    setForm({
      Id: item?.Id ?? "00000000-0000-0000-0000-000000000000",
      CycleId: item?.CycleId ?? "",
      Title: item?.Title ?? "",
      Description: item?.Description ?? "",
      StandardId: item?.StandardId ?? "",
      CriterionId: item?.CriterionId ?? "",
      Priority: String(item?.Priority ?? 2),
      Deadline: parseDateInput(item?.Deadline),
      Kpi: item?.Kpi ?? "",
      SourceFindingId: item?.SourceFindingId ?? "",
      AssignedTo: item?.Assignees?.map((x) => x.UserId).join(", ") ?? "",
      RevisionReason: item?.RevisionReason ?? "",
    });
  }, [item]);

  const findingsQuery = useQuery({
    queryKey: ["action-plan", "findings", form.CycleId],
    queryFn: async (): Promise<ExternalFindingOption[]> => {
      const response = await actionPlanService.getExternalReviewFindings({
        CycleId: form.CycleId || null,
      });
      if (!response.Success || !response.Data) {
        throw new Error(response.Message || "Không thể tải danh sách phát hiện.");
      }
      return response.Data;
    },
    enabled: open && Boolean(form.CycleId),
  });

  const currentStatus = Number(item?.Status ?? 1) as ActionPlanStatus;
  const canSave = currentStatus === 1 || currentStatus === 3 || !item?.Id;
  const canSubmit = Boolean(item?.Id) && (currentStatus === 1 || currentStatus === 3);
  const canApprove = Boolean(item?.Id) && currentStatus === 2;
  const canRequestRevision = Boolean(item?.Id) && currentStatus === 2;
  const canAssign = Boolean(item?.Id) && currentStatus === 4;

  const findings = useMemo(() => findingsQuery.data ?? [], [findingsQuery.data]);

  const handleChangeFinding = (finding: ExternalFindingOption) => {
    setForm((prev) => ({
      ...prev,
      SourceFindingId: finding.Id,
      StandardId: finding.StandardId ?? prev.StandardId,
      CriterionId: finding.CriterionId ?? prev.CriterionId,
      Title: prev.Title || `Cải tiến từ phát hiện`,
      Description: finding.Content,
      Kpi: prev.Kpi || "Giảm phát hiện lặp lại",
    }));
  };

  const handleSave = async () => {
    await savePlan({
      Id: form.Id,
      CycleId: form.CycleId,
      Title: form.Title,
      Description: form.Description,
      StandardId: form.StandardId || null,
      CriterionId: form.CriterionId || null,
      Priority: Number(form.Priority) as ActionPriority,
      Deadline: form.Deadline ? new Date(form.Deadline).toISOString() : new Date().toISOString(),
      Kpi: form.Kpi,
      SourceFindingId: form.SourceFindingId || null,
      AssignedTo: [],
      IsActived: true,
    });
    onChanged();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    await submitPlan({ Id: item!.Id });
    onChanged();
    onOpenChange(false);
  };

  const handleApprove = async () => {
    await approvePlan({ Id: item!.Id });
    onChanged();
    onOpenChange(false);
  };

  const handleRequestRevision = async () => {
    await requestRevision({
      Id: item!.Id,
      Reason: form.RevisionReason.trim(),
    });
    onChanged();
    onOpenChange(false);
  };

  const handleAssign = async () => {
    const assignedTo = form.AssignedTo.split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    await assignPlan({ Id: item!.Id, AssignedTo: assignedTo });
    onChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[1200px] overflow-hidden p-0">
        <DialogTitle className="sr-only">Action Plan</DialogTitle>

        <div className="grid max-h-[92vh] grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-r bg-white p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {item?.Id && item.Id !== "00000000-0000-0000-0000-000000000000"
                    ? item.Title
                    : "Tạo kế hoạch hành động"}
                </h2>
                <p className="text-sm text-slate-500">
                  {item ? `Trạng thái: ${getActionPlanStatusLabel(Number(item.Status))}` : ""}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tên kế hoạch</Label>
                <Input
                  value={form.Title}
                  onChange={(e) => setForm((prev) => ({ ...prev, Title: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label>Chu kỳ</Label>
                <Combobox
                  options={cycleOptions.options ?? []}
                  loading={cycleOptions.isLoading}
                  value={form.CycleId || undefined}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, CycleId: value || "" }))
                  }
                  placeholder="Chọn chu kỳ"
                  searchPlaceholder="Tìm chu kỳ..."
                  emptyText="Không tìm thấy chu kỳ."
                />
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label>Tiêu chuẩn</Label>
                  <Input
                    value={form.StandardId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, StandardId: e.target.value }))
                    }
                    placeholder="UUID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tiêu chí</Label>
                  <Input
                    value={form.CriterionId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, CriterionId: e.target.value }))
                    }
                    placeholder="UUID"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ưu tiên</Label>
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={form.Priority}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, Priority: e.target.value }))
                    }
                  >
                    <option value="1">Cao</option>
                    <option value="2">Trung bình</option>
                    <option value="3">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Thời hạn</Label>
                  <Input
                    type="date"
                    value={form.Deadline}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, Deadline: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phát hiện gốc</Label>
                  <Input
                    value={form.SourceFindingId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, SourceFindingId: e.target.value }))
                    }
                    placeholder="UUID"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>KPI</Label>
                <Textarea
                  value={form.Kpi}
                  onChange={(e) => setForm((prev) => ({ ...prev, Kpi: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={form.Description ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, Description: e.target.value }))
                  }
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label>Người thực hiện</Label>
                <Textarea
                  value={form.AssignedTo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, AssignedTo: e.target.value }))
                  }
                  rows={2}
                  placeholder="Nhập UserId, ngăn cách bằng dấu phẩy"
                />
              </div>

              <div className="grid gap-2">
                <Label>Lý do chỉnh sửa</Label>
                <Textarea
                  value={form.RevisionReason}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, RevisionReason: e.target.value }))
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleSave()} disabled={isMutating || !canSave}>
                Lưu
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleSubmit()}
                disabled={isMutating || !canSubmit}
              >
                Gửi duyệt
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleApprove()}
                disabled={isMutating || !canApprove}
              >
                Duyệt
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleRequestRevision()}
                disabled={isMutating || !canRequestRevision || !form.RevisionReason.trim()}
              >
                Yêu cầu chỉnh sửa
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleAssign()}
                disabled={isMutating || !canAssign || !form.AssignedTo.trim()}
              >
                Giao việc
              </Button>
            </div>
          </div>

          <div className="min-h-0 overflow-auto bg-slate-50 p-6">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-slate-900">Phát hiện gốc</h3>
              <p className="text-sm text-slate-500">
                Chọn một phát hiện để điền nhanh vào biểu mẫu.
              </p>
            </div>

            {!form.CycleId ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Chọn chu kỳ để tải danh sách phát hiện.
              </div>
            ) : findingsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách phát hiện...
              </div>
            ) : findings.length > 0 ? (
              <div className="space-y-3">
                {findings.map((finding) => (
                  <button
                    key={finding.Id}
                    type="button"
                    onClick={() => handleChangeFinding(finding)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {finding.Summary ?? finding.Content}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {finding.CriterionId ? `Criterion: ${finding.CriterionId}` : "Không có tiêu chí"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Không có phát hiện nào cho chu kỳ này.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
