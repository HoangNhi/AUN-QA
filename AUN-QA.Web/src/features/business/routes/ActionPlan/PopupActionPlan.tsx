import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datepicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, { type Option } from "@/components/ui/multi-select";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import type { Attachment } from "@/features/file/types/uploadfile.types";
import { cn } from "@/lib/utils";
import { useCycleOptions } from "@/features/business/hooks/useCycleOptions";
import { useStandardsByCycle } from "@/features/business/hooks/useStandardsByCycle";
import { useCriteriaByStandard } from "@/features/business/hooks/useCriteriaByStandard";
import { actionPlanService } from "@/features/business/api/actionPlan.api";
import { useActionPlan } from "./hooks/useActionPlan";
import { useAssignableUsersOptions } from "./hooks/useAssignableUsersOptions";
import type {
  ActionPlanDetail,
  ActionPlanStatus,
  ActionPriority,
  AssignableMember,
  ExternalFindingOption,
} from "@/features/business/types/actionPlan.types";
import {
  canChangeStatus,
  canEditActionPlan,
  normalizeActionPlanStatusForSave,
  shouldShowAssigneeSection,
} from "./actionPlan.utils";
import {
  getActionPlanStatusComboboxOptions,
  getFindingStandardDisplay,
  resolveCriterionSelection,
} from "./popupActionPlan.helpers";

interface PopupActionPlanProps {
  open: boolean;
  item: ActionPlanDetail | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

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

function parseLocalDate(value: string | undefined | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function isAssigneeSectionVisible(isNew: boolean): boolean {
  return shouldShowAssigneeSection(isNew);
}

export function getPopupSaveStatus(status: number, isNew: boolean): number {
  return normalizeActionPlanStatusForSave(status, isNew);
}

export default function PopupActionPlan({
  open,
  item,
  onOpenChange,
  onChanged,
}: PopupActionPlanProps) {
  const { savePlan, isMutating } = useActionPlan();
  const cycleOptions = useCycleOptions(open);
  const uploadRef = useRef<UploadFileRef>(null);
  const [formScrollContainer, setFormScrollContainer] =
    useState<HTMLDivElement | null>(null);

  const [form, setForm] = useState({
    Id: item?.Id ?? EMPTY_GUID,
    CycleId: item?.CycleId ?? "",
    Title: item?.Title ?? "",
    Description: item?.Description ?? "",
    StandardId: item?.StandardId ?? "",
    CriterionId: item?.CriterionId ?? "",
    Priority: String(item?.Priority ?? 2),
    Deadline: parseDateInput(item?.Deadline),
    SourceFindingId: item?.SourceFindingId ?? "",
    Status: Number(item?.Status ?? 1),
  });
  const [assignedTo, setAssignedTo] = useState<string[]>(
    item?.Assignees?.map((a) => a.UserId) ?? [],
  );
  const [folderUpload, setFolderUpload] = useState<string>(uuidv4());
  const [listAttachment, setListAttachment] = useState<Attachment[]>([]);
  const [pendingFindingCriterionId, setPendingFindingCriterionId] = useState<
    string | null
  >(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      Id: item?.Id ?? EMPTY_GUID,
      CycleId: item?.CycleId ?? "",
      Title: item?.Title ?? "",
      Description: item?.Description ?? "",
      StandardId: item?.StandardId ?? "",
      CriterionId: item?.CriterionId ?? "",
      Priority: String(item?.Priority ?? 2),
      Deadline: parseDateInput(item?.Deadline),
      SourceFindingId: item?.SourceFindingId ?? "",
      Status: Number(item?.Status ?? 1),
    });
    setAssignedTo(item?.Assignees?.map((a) => a.UserId) ?? []);
    setFolderUpload(uuidv4());
    setListAttachment((item?.Attachments ?? []) as Attachment[]);
    setIsPanelOpen(true);
  }, [item, open]);

  const councilRoleQuery = useQuery({
    queryKey: ["action-plan", "my-council-role", form.CycleId],
    queryFn: async (): Promise<number> => {
      if (!form.CycleId) {
        return 0;
      }

      const response = await actionPlanService.getMyCouncilRole(form.CycleId);
      if (!response.Success || response.Data == null) {
        return 0;
      }

      return response.Data;
    },
    enabled: open && Boolean(form.CycleId),
  });

  const standards = useStandardsByCycle(form.CycleId || undefined);
  const criteria = useCriteriaByStandard(form.StandardId || undefined);
  const { members: assignableMembers } = useAssignableUsersOptions(open);
  const currentActionPlanId =
    !form.Id || form.Id === EMPTY_GUID ? null : form.Id;

  const findingsQuery = useQuery({
    queryKey: ["action-plan", "findings", form.CycleId, currentActionPlanId],
    queryFn: async (): Promise<ExternalFindingOption[]> => {
      const response = await actionPlanService.getExternalReviewFindings({
        CycleId: form.CycleId || null,
        CurrentActionPlanId: currentActionPlanId,
      });
      if (!response.Success || !response.Data) {
        return [];
      }
      return response.Data;
    },
    enabled: open && Boolean(form.CycleId),
  });

  const findings = useMemo(
    () => findingsQuery.data ?? [],
    [findingsQuery.data],
  );
  const statusOptions = useMemo(() => getActionPlanStatusComboboxOptions(), []);
  const selectedFinding = useMemo(
    () =>
      findings.find((finding) => finding.Id === form.SourceFindingId) ?? null,
    [findings, form.SourceFindingId],
  );
  const assignableMemberLabel = (member: AssignableMember) =>
    member.Fullname || member.Username || member.UserId;
  const assigneeOptions = useMemo<Option[]>(
    () =>
      assignableMembers.map((member) => ({
        value: member.UserId,
        label: assignableMemberLabel(member),
      })),
    [assignableMembers],
  );
  const selectedAssigneeOptions = useMemo<Option[]>(
    () =>
      assignedTo.map((userId) => {
        const option = assigneeOptions.find((item) => item.value === userId);
        return option ?? { value: userId, label: userId };
      }),
    [assignedTo, assigneeOptions],
  );

  useEffect(() => {
    if (!pendingFindingCriterionId || criteria.isLoading) {
      return;
    }

    const resolvedCriterionId = resolveCriterionSelection(
      pendingFindingCriterionId,
      criteria.options ?? [],
    );

    setForm((prev) => ({ ...prev, CriterionId: resolvedCriterionId }));
    setPendingFindingCriterionId(null);
  }, [criteria.isLoading, criteria.options, pendingFindingCriterionId]);

  const currentStatus = Number(form.Status) as ActionPlanStatus;
  const isNew = !item?.Id || item.Id === EMPTY_GUID;
  const isStatusChangeable = canChangeStatus(councilRoleQuery.data ?? 0);
  const canEditFields = canEditActionPlan(currentStatus);
  const canEditAssignees = isStatusChangeable;
  const isCompleted = currentStatus === 4;

  const handleChangeFinding = (finding: ExternalFindingOption) => {
    setForm((prev) => ({
      ...prev,
      SourceFindingId: finding.Id,
      StandardId: finding.StandardId ?? "",
      CriterionId: "",
      Title: prev.Title || "Cải tiến từ phát hiện",
      Description: finding.Content,
    }));

    setPendingFindingCriterionId(finding.CriterionId ?? null);
  };

  const handleSave = async () => {
    const saveStatus = getPopupSaveStatus(Number(form.Status), isNew);

    if (isStatusChangeable && saveStatus === 2 && assignedTo.length === 0) {
      toast.error(
        "Vui lòng chọn ít nhất một người thực hiện trước khi chuyển sang Đang thực hiện.",
      );
      return;
    }

    const uploadSuccess = await uploadRef.current?.upload();
    if (uploadSuccess === false) {
      return;
    }

    await savePlan({
      Id: form.Id,
      CycleId: form.CycleId,
      Title: form.Title,
      Description: form.Description || null,
      StandardId: form.StandardId || null,
      CriterionId: form.CriterionId || null,
      Priority: Number(form.Priority) as ActionPriority,
      Deadline: form.Deadline
        ? new Date(form.Deadline).toISOString()
        : new Date().toISOString(),
      SourceFindingId: form.SourceFindingId || null,
      AssignedTo: isNew ? [] : assignedTo,
      Status: saveStatus,
      AttachmentIds: listAttachment.map((attachment) => attachment.Id),
      FolderUpload: folderUpload,
      IsActived: true,
    });

    onChanged();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[94vh] w-[96vw] max-w-[96vw] overflow-hidden p-0 sm:max-w-[1420px]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Kế hoạch cải tiến</DialogTitle>

        <div className="relative flex max-h-[94vh] overflow-hidden">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r bg-white">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b p-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {isNew ? "Tạo kế hoạch cải tiến" : item?.Title}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={setFormScrollContainer}
              className="relative flex-1 overflow-y-auto p-5"
            >
              <div className="grid gap-4">
                {currentStatus === 3 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Tất cả công việc đã hoàn thành. CTH/PCT có thể xác nhận hoặc
                    yêu cầu thực hiện lại.
                  </div>
                )}

                {isCompleted && item?.CompletedAt && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <p className="font-medium">Đã hoàn thành</p>
                    <p className="mt-1 text-xs text-green-600">
                      Bởi {item.CompletedBy} -{" "}
                      {new Date(item.CompletedAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>
                    Tên kế hoạch <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.Title}
                    readOnly={!canEditFields && !isNew}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, Title: e.target.value }))
                    }
                    placeholder="Nhập tên kế hoạch cải tiến..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>
                    Chu kỳ <span className="text-red-500">*</span>
                  </Label>
                  <Combobox
                    options={cycleOptions.options ?? []}
                    loading={cycleOptions.isLoading}
                    value={form.CycleId || undefined}
                    onValueChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        CycleId: value || "",
                        StandardId: "",
                        CriterionId: "",
                      }));
                      setPendingFindingCriterionId(null);
                    }}
                    placeholder="Chọn chu kỳ"
                    searchPlaceholder="Tìm chu kỳ..."
                    emptyText="Không tìm thấy chu kỳ."
                    disabled={!isNew && !canEditFields}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Tiêu chuẩn</Label>
                    <Combobox
                      options={(standards.options ?? []).map((standard) => ({
                        Value: standard.Value,
                        Text: standard.Text,
                      }))}
                      loading={standards.isLoading}
                      value={form.StandardId || undefined}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          StandardId: value || "",
                          CriterionId: "",
                        }));
                        setPendingFindingCriterionId(null);
                      }}
                      placeholder="Chọn tiêu chuẩn..."
                      emptyText="Không có tiêu chuẩn."
                      disabled={(!canEditFields && !isNew) || !form.CycleId}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tiêu chí</Label>
                    <Combobox
                      options={(criteria.options ?? []).map((criterion) => ({
                        Value: criterion.Value,
                        Text: criterion.Text,
                      }))}
                      loading={criteria.isLoading}
                      value={form.CriterionId || undefined}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          CriterionId: value || "",
                        }))
                      }
                      placeholder="Chọn tiêu chí..."
                      emptyText="Không có tiêu chí."
                      disabled={(!canEditFields && !isNew) || !form.StandardId}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label>Trạng thái</Label>
                    <Combobox
                      options={statusOptions}
                      value={String(form.Status)}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          Status: Number(value || prev.Status),
                        }))
                      }
                      placeholder="Chọn trạng thái..."
                      emptyText="Không có trạng thái."
                      readonly={isNew || !isStatusChangeable}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Ưu tiên</Label>
                    <Select
                      value={form.Priority}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          Priority: value,
                        }))
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        disabled={!canEditFields && !isNew}
                      >
                        <SelectValue placeholder="Chọn ưu tiên..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Cao</SelectItem>
                        <SelectItem value="2">Trung bình</SelectItem>
                        <SelectItem value="3">Thấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label>
                      Thời hạn <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      className="w-full"
                      optionLabel="Chọn thời hạn"
                      value={parseLocalDate(form.Deadline)}
                      onChange={(date) =>
                        setForm((prev) => ({
                          ...prev,
                          Deadline: date ? format(date, "yyyy-MM-dd") : "",
                        }))
                      }
                      disabled={!canEditFields && !isNew}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Mô tả</Label>
                  <Textarea
                    value={form.Description ?? ""}
                    readOnly={!canEditFields && !isNew}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        Description: e.target.value,
                      }))
                    }
                    rows={4}
                    placeholder="Mô tả kế hoạch cải tiến..."
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Kiến nghị từ CHECK</Label>
                  {selectedFinding ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-900">
                        {selectedFinding.Content}
                      </p>
                      {(canEditFields || isNew) && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              SourceFindingId: "",
                            }))
                          }
                          className="mt-2 text-xs text-amber-600 hover:text-amber-800"
                        >
                          ✕ Bỏ chọn
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-400">
                      Chọn kiến nghị từ phần bên phải để tự điền
                    </p>
                  )}
                </div>

                {isAssigneeSectionVisible(isNew) && (
                  <div className="grid gap-2">
                    <Label>Người thực hiện</Label>
                    {canEditAssignees ? (
                      <>
                        <MultipleSelector
                          value={selectedAssigneeOptions}
                          options={assigneeOptions}
                          onChange={(options) =>
                            setAssignedTo(options.map((option) => option.value))
                          }
                          placeholder="Thêm người thực hiện..."
                          hidePlaceholderWhenSelected
                          portalContainer={formScrollContainer}
                        />
                        <div className="hidden">
                          <Combobox
                            options={assignableMembers.map((member) => ({
                              Value: member.UserId,
                              Text: assignableMemberLabel(member),
                            }))}
                            value={undefined}
                            onValueChange={(value) => {
                              if (value && !assignedTo.includes(value)) {
                                setAssignedTo((prev) => [...prev, value]);
                              }
                            }}
                            placeholder="Thêm người thực hiện..."
                            emptyText="Không có thành viên phù hợp."
                          />
                          {assignedTo.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {assignedTo.map((userId) => {
                                const member = assignableMembers.find(
                                  (item) => item.UserId === userId,
                                );
                                return (
                                  <span
                                    key={userId}
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                                  >
                                    {member
                                      ? assignableMemberLabel(member)
                                      : userId}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAssignedTo((prev) =>
                                          prev.filter((id) => id !== userId),
                                        )
                                      }
                                      className="ml-1 text-blue-500 hover:text-blue-800"
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {item?.Assignees?.length ? (
                          item.Assignees.map((assignee) => (
                            <span
                              key={assignee.UserId}
                              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                            >
                              {assignee.Fullname ??
                                assignee.Username ??
                                assignee.UserId}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm italic text-slate-400">
                            Chưa có người thực hiện
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Tài liệu đính kèm</Label>
                  <UploadFile
                    ref={uploadRef}
                    folderUpload={folderUpload}
                    listAttachment={listAttachment}
                    setListAttachment={setListAttachment}
                    readonly={!canEditFields && !isNew}
                    multiFile
                    previewContext="ActionPlan"
                  />
                </div>

                {!isNew && item?.Tasks && item.Tasks.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Tiến độ công việc</Label>
                    <div className="space-y-2">
                      {(() => {
                        const done = item.Tasks.filter(
                          (task) => Number(task.TaskStatus) === 3,
                        ).length;
                        const total = item.Tasks.length;
                        const percent =
                          total > 0 ? Math.round((done / total) * 100) : 0;
                        return (
                          <>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>
                                {done}/{total} việc hoàn thành
                              </span>
                              <span className="font-medium">{percent}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-blue-500 transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-2 border-t bg-white p-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                {isCompleted && !isStatusChangeable ? "Đóng" : "Hủy"}
              </Button>
              {(isStatusChangeable || canEditFields || isNew) && (
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={
                    isMutating || !form.Title || !form.CycleId || !form.Deadline
                  }
                >
                  {isMutating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Lưu
                </Button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsPanelOpen((value) => !value)}
              className="absolute right-0 top-1/2 z-10 flex h-10 w-3.5 -translate-y-1/2 items-center justify-center rounded-l bg-sky-500 text-white shadow-md hover:bg-sky-600"
              aria-label={isPanelOpen ? "Ẩn kiến nghị" : "Hiện kiến nghị"}
            >
              {isPanelOpen ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </button>
          </div>

          {isPanelOpen && (
            <div className="w-80 shrink-0 overflow-auto border-l bg-slate-50 p-5">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-900">
                  Kiến nghị từ CHECK
                </h3>
                <p className="text-xs text-slate-500">
                  Chọn để điền nhanh vào biểu mẫu.
                </p>
              </div>

              {!form.CycleId ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Chọn chu kỳ để tải danh sách phát hiện.
                </div>
              ) : findingsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải...
                </div>
              ) : findings.length > 0 ? (
                <div className="space-y-3">
                  {findings.map((finding) => {
                    const isSelected = finding.Id === form.SourceFindingId;

                    return (
                      <button
                        key={finding.Id}
                        type="button"
                        onClick={() =>
                          (canEditFields || isNew) &&
                          handleChangeFinding(finding)
                        }
                        disabled={!canEditFields && !isNew}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left shadow-sm transition",
                          isSelected
                            ? "border-sky-400 bg-sky-50 ring-2 ring-sky-400"
                            : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/40",
                          !canEditFields &&
                            !isNew &&
                            "cursor-default opacity-60",
                        )}
                      >
                        <p className="text-sm font-medium text-slate-900">
                          {finding.Summary ?? finding.Content}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Tiêu chuẩn: {getFindingStandardDisplay(finding)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  Không có phát hiện nào cho chu kỳ này.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
