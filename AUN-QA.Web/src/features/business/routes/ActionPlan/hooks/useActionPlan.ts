import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { actionPlanService } from "@/features/business/api/actionPlan.api";
import type {
  ActionPlanApproveRequest,
  ActionPlanAssignRequest,
  ActionPlanDeleteListRequest,
  ActionPlanRequestRevisionRequest,
  ActionPlanSubmitRequest,
  ActionPlanUpsertRequest,
} from "@/features/business/types/actionPlan.types";

export function useActionPlan() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["action-plan"] });
    await queryClient.invalidateQueries({ queryKey: ["task-execution"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (request: ActionPlanUpsertRequest) => {
      const response =
        request.Id && request.Id !== "00000000-0000-0000-0000-000000000000"
          ? await actionPlanService.update(request)
          : await actionPlanService.insert(request);

      if (!response.Success || !response.Data) {
        throw new Error(response.Message || "Không thể lưu kế hoạch hành động.");
      }

      return response.Data;
    },
    onSuccess: async () => {
      toast.success("Đã lưu kế hoạch hành động.");
      await invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể lưu kế hoạch hành động.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (request: ActionPlanDeleteListRequest) => {
      const response = await actionPlanService.deleteList(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể xóa kế hoạch hành động.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã xóa kế hoạch hành động.");
      await invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Không thể xóa kế hoạch hành động.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (request: ActionPlanSubmitRequest) => {
      const response = await actionPlanService.submit(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể gửi kế hoạch.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã gửi kế hoạch.");
      await invalidate();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (request: ActionPlanApproveRequest) => {
      const response = await actionPlanService.approve(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể duyệt kế hoạch.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã duyệt kế hoạch.");
      await invalidate();
    },
  });

  const revisionMutation = useMutation({
    mutationFn: async (request: ActionPlanRequestRevisionRequest) => {
      const response = await actionPlanService.requestRevision(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể yêu cầu chỉnh sửa.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã yêu cầu chỉnh sửa.");
      await invalidate();
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (request: ActionPlanAssignRequest) => {
      const response = await actionPlanService.assign(request);
      if (!response.Success) {
        throw new Error(response.Message || "Không thể giao kế hoạch.");
      }
    },
    onSuccess: async () => {
      toast.success("Đã giao kế hoạch.");
      await invalidate();
    },
  });

  return {
    savePlan: (request: ActionPlanUpsertRequest) => saveMutation.mutateAsync(request),
    deleteList: (request: ActionPlanDeleteListRequest) => deleteMutation.mutateAsync(request),
    submitPlan: (request: ActionPlanSubmitRequest) => submitMutation.mutateAsync(request),
    approvePlan: (request: ActionPlanApproveRequest) => approveMutation.mutateAsync(request),
    requestRevision: (request: ActionPlanRequestRevisionRequest) =>
      revisionMutation.mutateAsync(request),
    assignPlan: (request: ActionPlanAssignRequest) => assignMutation.mutateAsync(request),
    isMutating: useMemo(
      () =>
        saveMutation.isPending ||
        deleteMutation.isPending ||
        submitMutation.isPending ||
        approveMutation.isPending ||
        revisionMutation.isPending ||
        assignMutation.isPending,
      [
        approveMutation.isPending,
        assignMutation.isPending,
        deleteMutation.isPending,
        revisionMutation.isPending,
        saveMutation.isPending,
        submitMutation.isPending,
      ],
    ),
  };
}
