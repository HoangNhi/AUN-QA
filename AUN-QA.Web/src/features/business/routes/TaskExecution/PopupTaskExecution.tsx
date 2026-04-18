import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Paperclip, Plus, RotateCw, Trash2, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadFile, { type UploadFileRef } from "@/components/ui/upload-file";
import { taskExecutionService } from "@/features/business/api/taskExecution.api";
import { useActionTask } from "./hooks/useActionTask";
import type {
  TaskExecutionPlanDetail,
  TaskExecutionPlanListItem,
  TaskExecutionTask,
} from "@/features/business/types/taskExecution.types";
import { ActionPlanStatus, ActionTaskStatus } from "@/features/business/types/actionPlan.types";
import { canDeleteTask, getTaskStatusLabel } from "./taskExecution.utils";
import { getActionPlanStatusLabel } from "../ActionPlan/actionPlan.utils";
import { getFileUrl, formatDate } from "@/lib/utils";

interface TaskDraft {
  Id: string;
  Description: string;
  Note: string;
  TaskStatus: string;
  DueDate: string;
  FolderUpload: string;
}

interface PopupTaskExecutionProps {
  open: boolean;
  item: TaskExecutionPlanListItem;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

function createEmptyDraft(actionPlanId: string): TaskDraft {
  return {
    Id: "00000000-0000-0000-0000-000000000000",
    Description: "",
    Note: "",
    TaskStatus: String(ActionTaskStatus.Todo),
    DueDate: "",
    FolderUpload: actionPlanId ? uuidv4() : uuidv4(),
  };
}

function parseDateInput(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function hydrateDraft(task: TaskExecutionTask | null | undefined): TaskDraft {
  if (!task) {
    return createEmptyDraft("");
  }

  return {
    Id: task.Id,
    Description: task.Description ?? "",
    Note: task.Note ?? "",
    TaskStatus: String(task.TaskStatus ?? ActionTaskStatus.Todo),
    DueDate: parseDateInput(task.DueDate),
    FolderUpload: task.Id,
  };
}

export default function PopupTaskExecution({
  open,
  item,
  onOpenChange,
  onChanged,
}: PopupTaskExecutionProps) {
  const uploadRef = useRef<UploadFileRef>(null);
  const [draft, setDraft] = useState<TaskDraft>(() => createEmptyDraft(item.Id));
  const [activeTab, setActiveTab] = useState("general");

  const { saveTask, deleteTask, uploadAttachment, deleteAttachment, isMutating } =
    useActionTask();

  const planDetailQuery = useQuery({
    queryKey: ["task-execution", "plan-detail", item.Id],
    queryFn: async (): Promise<TaskExecutionPlanDetail> => {
      const response = await taskExecutionService.getPlanDetail(item.Id);
      if (!response.Success || !response.Data) {
        throw new Error(response.Message || "Không thể tải chi tiết kế hoạch.");
      }
      return response.Data;
    },
    enabled: open && Boolean(item.Id),
  });

  const planDetail = planDetailQuery.data ?? null;
  const tasks = useMemo(() => planDetail?.Tasks ?? [], [planDetail?.Tasks]);
  const canEdit = Number(planDetail?.Status ?? item.Status) === ActionPlanStatus.InProgress;

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveTab("general");
    setDraft(createEmptyDraft(item.Id));
  }, [item.Id, open]);

  const resetDraft = () => {
    setDraft(createEmptyDraft(planDetail?.Id ?? item.Id));
    uploadRef.current?.getPendingFiles();
  };

  const openNewTask = () => {
    setDraft(createEmptyDraft(planDetail?.Id ?? item.Id));
    setActiveTab("tasks");
  };

  const openEditTask = (task: TaskExecutionTask) => {
    setDraft(hydrateDraft(task));
    setActiveTab("tasks");
  };

  const refreshPlan = async () => {
    await planDetailQuery.refetch();
    onChanged();
  };

  const handleSaveTask = async () => {
    if (!planDetail?.Id && !item.Id) {
      return;
    }

    const pendingFiles = uploadRef.current?.getPendingFiles() ?? [];
    const savedTask = await saveTask({
      Id: draft.Id,
      ActionPlanId: planDetail?.Id ?? item.Id,
      Description: draft.Description.trim(),
      Note: draft.Note.trim() || null,
      TaskStatus: Number(draft.TaskStatus),
      DueDate: draft.DueDate ? new Date(draft.DueDate).toISOString() : null,
      FolderUpload: draft.FolderUpload,
    });

    if (pendingFiles.length > 0) {
      const uploaded = await uploadRef.current?.upload();
      if (uploaded) {
        await uploadAttachment({
          TaskId: savedTask.Id,
          FolderUpload: draft.FolderUpload,
        });
      }
    }

    setDraft(createEmptyDraft(planDetail?.Id ?? item.Id));
    await refreshPlan();
    setActiveTab("tasks");
  };

  const handleDeleteTask = async (task: TaskExecutionTask) => {
    if (!canDeleteTask(Number(task.TaskStatus))) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa công việc này không?");
    if (!confirmed) {
      return;
    }

    await deleteTask({ TaskId: task.Id });
    await refreshPlan();
    if (draft.Id === task.Id) {
      resetDraft();
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa tệp đính kèm này không?");
    if (!confirmed) {
      return;
    }

    await deleteAttachment({ AttachmentId: attachmentId });
    await refreshPlan();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[1280px] overflow-hidden p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Task Execution</DialogTitle>

        <div className="grid max-h-[92vh] grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-r bg-white p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-900">
                  {planDetail?.Title || item.Title}
                </h2>
                <p className="text-sm text-slate-500">
                  Trạng thái:{" "}
                  {getActionPlanStatusLabel(Number(planDetail?.Status ?? item.Status))}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {planDetailQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải chi tiết kế hoạch...
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                  <TabsTrigger value="tasks">Công việc</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4 space-y-4">
                  <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div>
                      <Label className="text-slate-500">Chu kỳ</Label>
                      <p className="font-medium text-slate-900">
                        {item.CycleName} ({item.Year})
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Mô tả</Label>
                      <p className="text-slate-700">
                        {planDetail?.Description || "Không có mô tả."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-500">Ưu tiên</Label>
                        <p className="text-slate-700">
                          {planDetail?.Priority === 1
                            ? "Cao"
                            : planDetail?.Priority === 3
                              ? "Thấp"
                              : "Trung bình"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-500">Hạn</Label>
                        <p className="text-slate-700">
                          {planDetail?.Deadline
                            ? new Date(planDetail.Deadline).toLocaleDateString("vi-VN")
                            : new Date(item.Deadline).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-500">Người thực hiện</Label>
                      <p className="text-slate-700">
                        {planDetail?.Assignees?.length
                          ? planDetail.Assignees.map((assignee) => assignee.Fullname || assignee.Username || assignee.UserId).join(", ")
                          : item.AssignedToNames || "Chưa có người thực hiện."}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-500">Tiến độ</Label>
                      <p className="text-slate-700">
                        {planDetail?.Tasks?.filter((task) => Number(task.TaskStatus) === Number(ActionTaskStatus.Done)).length || 0}
                        /{planDetail?.Tasks?.length || item.TotalTaskCount}
                      </p>
                    </div>
                  </div>

                  {!canEdit ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Kế hoạch này chưa ở trạng thái đang thực hiện nên chưa thể chỉnh sửa công việc.
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={openNewTask} disabled={!canEdit || isMutating}>
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm công việc
                    </Button>
                    <Button type="button" variant="secondary" onClick={refreshPlan} disabled={isMutating}>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Làm mới
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="mt-4 space-y-4">
                  <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {draft.Id && draft.Id !== "00000000-0000-0000-0000-000000000000"
                            ? "Chỉnh sửa công việc"
                            : "Thêm công việc mới"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {canEdit
                            ? "Lưu công việc trước, sau đó tải tệp đính kèm nếu có."
                            : "Chế độ chỉ xem."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetDraft}
                        disabled={!canEdit || isMutating}
                      >
                        Đặt lại
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Mô tả công việc</Label>
                        <Textarea
                          value={draft.Description}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, Description: e.target.value }))
                          }
                          placeholder="Nhập mô tả công việc..."
                          rows={3}
                          disabled={!canEdit || isMutating}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Ghi chú</Label>
                        <Textarea
                          value={draft.Note}
                          onChange={(e) => setDraft((prev) => ({ ...prev, Note: e.target.value }))}
                          placeholder="Ghi chú thêm..."
                          rows={2}
                          disabled={!canEdit || isMutating}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Trạng thái</Label>
                          <select
                            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={draft.TaskStatus}
                            onChange={(e) =>
                              setDraft((prev) => ({ ...prev, TaskStatus: e.target.value }))
                            }
                            disabled={!canEdit || isMutating}
                          >
                            <option value={String(ActionTaskStatus.Todo)}>Chờ thực hiện</option>
                            <option value={String(ActionTaskStatus.InProgress)}>Đang thực hiện</option>
                            <option value={String(ActionTaskStatus.Done)}>Hoàn thành</option>
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Hạn hoàn thành</Label>
                          <Input
                            type="date"
                            value={draft.DueDate}
                            onChange={(e) =>
                              setDraft((prev) => ({ ...prev, DueDate: e.target.value }))
                            }
                            disabled={!canEdit || isMutating}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Tệp đính kèm mới</Label>
                        <UploadFile
                          key={draft.FolderUpload}
                          ref={uploadRef}
                          folderUpload={draft.FolderUpload}
                          fileSizeLimit={100}
                          readonly={!canEdit || isMutating}
                          allowDownload
                          viewerMode="internal"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" onClick={() => void handleSaveTask()} disabled={!canEdit || isMutating || !draft.Description.trim()}>
                          {isMutating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Lưu công việc
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={openNewTask}
                          disabled={!canEdit || isMutating}
                        >
                          Tạo mới
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-900">Danh sách công việc</h3>
                      <p className="text-sm text-slate-500">{tasks.length} công việc</p>
                    </div>

                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <div
                          key={task.Id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">{task.Description}</p>
                              <p className="text-xs text-slate-500">
                                {getTaskStatusLabel(Number(task.TaskStatus))}
                                {task.DueDate
                                  ? ` • Hạn ${new Date(task.DueDate).toLocaleDateString("vi-VN")}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => openEditTask(task)}
                                disabled={!canEdit || isMutating}
                              >
                                Sửa
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => void handleDeleteTask(task)}
                                disabled={!canEdit || isMutating || !canDeleteTask(Number(task.TaskStatus))}
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>

                          {task.Note ? (
                            <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{task.Note}</p>
                          ) : null}

                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                              <Paperclip className="h-4 w-4" />
                              Tệp đính kèm
                            </div>

                            {task.Attachments.length > 0 ? (
                              <div className="space-y-2">
                                {task.Attachments.map((attachment) => {
                                  const fileUrl = getFileUrl(attachment.FileUrl);
                                  return (
                                    <div
                                      key={attachment.Id}
                                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                                    >
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="min-w-0 truncate text-sm font-medium text-sky-700 hover:underline"
                                      >
                                        {attachment.FileName}
                                      </a>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">
                                          {formatDate(attachment.UploadedAt.toString())}
                                        </span>
                                        <Button
                                          type="button"
                                          size="icon-sm"
                                          variant="ghost"
                                          onClick={() => void handleDeleteAttachment(attachment.Id)}
                                          disabled={!canEdit || isMutating}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">Chưa có tệp đính kèm.</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                        Chưa có công việc nào trong kế hoạch này.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
