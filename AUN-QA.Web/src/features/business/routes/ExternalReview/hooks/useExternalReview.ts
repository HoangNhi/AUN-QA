import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { externalReviewService } from "@/features/business/api/externalReview.api";
import type { ExternalReviewDetail } from "@/features/business/types/externalReview.types";

function isMissingReviewResponse(message?: string): boolean {
  const normalized = (message || "").toLowerCase();
  return (
    normalized.includes("khong tim thay") ||
    normalized.includes("không tìm thấy") ||
    normalized.includes("not found") ||
    normalized.includes("does not exist")
  );
}

export function useExternalReview() {
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const queryClient = useQueryClient();

  const {
    data: review,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["external-review", "detail", selectedCycleId],
    queryFn: async (): Promise<ExternalReviewDetail | null> => {
      const response = await externalReviewService.get({ CycleId: selectedCycleId });
      if (!response.Success) {
        if (isMissingReviewResponse(response.Message)) {
          return null;
        }
        throw new Error(response.Message || "Khong the tai External Review.");
      }

      const detail = response.Data ?? null;
      if (!detail) {
        return null;
      }

      const accountResponse = await externalReviewService.getAccounts({
        ExternalReviewId: detail.Id,
      });

      return {
        ...detail,
        Accounts: accountResponse.Success ? accountResponse.Data || [] : [],
        Results: detail.Results || [],
      };
    },
    enabled: !!selectedCycleId,
  });

  useEffect(() => {
    if (!isError || !error) {
      return;
    }

    toast.error(error instanceof Error ? error.message : "Khong the tai External Review.");
  }, [error, isError]);

  const invalidateCurrent = useCallback(async () => {
    if (!selectedCycleId) {
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ["external-review", "detail", selectedCycleId],
    });
  }, [queryClient, selectedCycleId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await externalReviewService.create({
        CycleId: selectedCycleId,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the khoi tao External Review.");
      }
      return response.Data ?? null;
    },
    onSuccess: async () => {
      toast.success("Da khoi tao External Review.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Khong the khoi tao External Review.",
      );
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: number) => {
      if (!review?.Id) {
        throw new Error("External Review chua duoc khoi tao.");
      }
      const response = await externalReviewService.updateStatus({
        ExternalReviewId: review.Id,
        Status: status,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the cap nhat trang thai.");
      }
    },
    onSuccess: async () => {
      toast.success("Da cap nhat trang thai.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the cap nhat trang thai.");
    },
  });

  const updateWatermarkMutation = useMutation({
    mutationFn: async (payload: { text?: string | null; opacity: number; position: number }) => {
      if (!review?.Id) {
        throw new Error("External Review chua duoc khoi tao.");
      }
      const response = await externalReviewService.updateWatermark({
        ExternalReviewId: review.Id,
        WatermarkText: payload.text,
        WatermarkOpacity: payload.opacity,
        WatermarkPosition: payload.position,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the cap nhat watermark.");
      }
    },
    onSuccess: async () => {
      toast.success("Da cap nhat watermark.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the cap nhat watermark.");
    },
  });

  const confirmCompletionMutation = useMutation({
    mutationFn: async () => {
      if (!review?.Id) {
        throw new Error("External Review chua duoc khoi tao.");
      }
      const response = await externalReviewService.confirmCompletion({
        ExternalReviewId: review.Id,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the xac nhan hoan tat.");
      }
    },
    onSuccess: async () => {
      toast.success("Da xac nhan hoan tat External Review.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the xac nhan hoan tat.");
    },
  });

  const addAccountsMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!review?.Id) {
        throw new Error("External Review chua duoc khoi tao.");
      }
      const response = await externalReviewService.addAccounts({
        ExternalReviewId: review.Id,
        UserIds: userIds,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the them tai khoan.");
      }
    },
    onSuccess: async () => {
      toast.success("Da them tai khoan danh gia ngoai.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the them tai khoan.");
    },
  });

  const removeAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      if (!review?.Id) {
        throw new Error("External Review chua duoc khoi tao.");
      }
      const response = await externalReviewService.removeAccount({
        AccountId: accountId,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the go tai khoan.");
      }
    },
    onSuccess: async () => {
      toast.success("Da go tai khoan.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the go tai khoan.");
    },
  });

  const isMutating = useMemo(
    () =>
      createMutation.isPending ||
      updateStatusMutation.isPending ||
      updateWatermarkMutation.isPending ||
      confirmCompletionMutation.isPending ||
      addAccountsMutation.isPending ||
      removeAccountMutation.isPending,
    [
      addAccountsMutation.isPending,
      confirmCompletionMutation.isPending,
      createMutation.isPending,
      removeAccountMutation.isPending,
      updateStatusMutation.isPending,
      updateWatermarkMutation.isPending,
    ],
  );

  return {
    selectedCycleId,
    setSelectedCycleId,
    review,
    isLoading,
    isFetching,
    isMutating,
    createReview: () => createMutation.mutateAsync(),
    updateStatus: (status: number) => updateStatusMutation.mutateAsync(status),
    updateWatermark: (payload: { text?: string | null; opacity: number; position: number }) =>
      updateWatermarkMutation.mutateAsync(payload),
    confirmCompletion: () => confirmCompletionMutation.mutateAsync(),
    addAccounts: (userIds: string[]) => addAccountsMutation.mutateAsync(userIds),
    removeAccount: (accountId: string) => removeAccountMutation.mutateAsync(accountId),
  };
}
