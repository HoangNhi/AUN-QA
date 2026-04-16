import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { taskExecutionService } from "@/features/business/api/taskExecution.api";
import type {
  TaskExecutionDeleteAttachmentRequest,
  TaskExecutionDeleteTaskRequest,
  TaskExecutionUpsertTaskRequest,
  TaskExecutionUploadAttachmentRequest,
} from "@/features/business/types/taskExecution.types";

export function useActionTask() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["task-execution"] });
    await queryClient.invalidateQueries({ queryKey: ["action-plan"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (request: TaskExecutionUpsertTaskRequest) => {
      const response =
        request.Id && request.Id !== "00000000-0000-0000-0000-000000000000"
          ? await taskExecutionService.updateTask(request)
          : await taskExecutionService.insertTask(request);

      if (!response.Success || !response.Data) {
        throw new Error(response.Message || "Không thể lưu công việc.");
      }

      return response.Data;
    },
    onSuccess: async () => {
      toast.success("Đã lưu công việc.");
      await invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể lưu công việc.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (request: TaskExecutionDeleteTaskRequest) => {
      const response = await taskExecutionService.deleteTask(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể xóa công việc.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã xóa công việc.");
      await invalidate();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (request: TaskExecutionUploadAttachmentRequest) => {
      const response = await taskExecutionService.uploadAttachment(request);
      if (!response.Success || !response.Data) {
        throw new Error(response.Message || "Không thể tải tệp đính kèm.");
      }

      return response.Data;
    },
    onSuccess: async () => {
      toast.success("Đã tải tệp đính kèm.");
      await invalidate();
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (request: TaskExecutionDeleteAttachmentRequest) => {
      const response = await taskExecutionService.deleteAttachment(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể xóa tệp đính kèm.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã xóa tệp đính kèm.");
      await invalidate();
    },
  });

  return {
    saveTask: (request: TaskExecutionUpsertTaskRequest) => saveMutation.mutateAsync(request),
    deleteTask: (request: TaskExecutionDeleteTaskRequest) => deleteMutation.mutateAsync(request),
    uploadAttachment: (request: TaskExecutionUploadAttachmentRequest) =>
      uploadMutation.mutateAsync(request),
    deleteAttachment: (request: TaskExecutionDeleteAttachmentRequest) =>
      deleteAttachmentMutation.mutateAsync(request),
    isMutating: useMemo(
      () =>
        saveMutation.isPending ||
        deleteMutation.isPending ||
        uploadMutation.isPending ||
        deleteAttachmentMutation.isPending,
      [
        deleteAttachmentMutation.isPending,
        deleteMutation.isPending,
        saveMutation.isPending,
        uploadMutation.isPending,
      ],
    ),
  };
}
