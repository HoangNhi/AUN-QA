import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { externalReviewService } from "@/features/business/api/externalReview.api";
import type {
  AddExternalReviewFindingRequest,
  UpdateExternalReviewFindingRequest,
} from "@/features/business/types/externalReview.types";

function buildMissingReviewError(): Error {
  return new Error("External Review chua duoc khoi tao.");
}

export function useExternalReviewResults(externalReviewId: string | null) {
  const queryClient = useQueryClient();

  const invalidateCurrent = useCallback(async () => {
    if (!externalReviewId) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: ["external-review", "detail"],
    });
  }, [externalReviewId, queryClient]);

  const upsertResultMutation = useMutation({
    mutationFn: async (payload: { standardId: string; strengths?: string | null }) => {
      if (!externalReviewId) {
        throw buildMissingReviewError();
      }

      const response = await externalReviewService.upsertResult({
        ExternalReviewId: externalReviewId,
        StandardId: payload.standardId,
        Strengths: payload.strengths,
      });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the luu ket qua danh gia.");
      }
    },
    onSuccess: async () => {
      toast.success("Da luu ket qua danh gia.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the luu ket qua danh gia.");
    },
  });

  const addFindingMutation = useMutation({
    mutationFn: async (payload: AddExternalReviewFindingRequest) => {
      if (!externalReviewId) {
        throw buildMissingReviewError();
      }

      const response = await externalReviewService.addFinding(payload);
      if (!response.Success) {
        throw new Error(response.Message || "Khong the them phat hien.");
      }
    },
    onSuccess: async () => {
      toast.success("Da them phat hien.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the them phat hien.");
    },
  });

  const updateFindingMutation = useMutation({
    mutationFn: async (payload: UpdateExternalReviewFindingRequest) => {
      if (!externalReviewId) {
        throw buildMissingReviewError();
      }

      const response = await externalReviewService.updateFinding(payload);
      if (!response.Success) {
        throw new Error(response.Message || "Khong the cap nhat phat hien.");
      }
    },
    onSuccess: async () => {
      toast.success("Da cap nhat phat hien.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the cap nhat phat hien.");
    },
  });

  const deleteFindingMutation = useMutation({
    mutationFn: async (findingId: string) => {
      if (!externalReviewId) {
        throw buildMissingReviewError();
      }

      const response = await externalReviewService.deleteFinding({ FindingId: findingId });
      if (!response.Success) {
        throw new Error(response.Message || "Khong the xoa phat hien.");
      }
    },
    onSuccess: async () => {
      toast.success("Da xoa phat hien.");
      await invalidateCurrent();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Khong the xoa phat hien.");
    },
  });

  const isMutating = useMemo(
    () =>
      upsertResultMutation.isPending ||
      addFindingMutation.isPending ||
      updateFindingMutation.isPending ||
      deleteFindingMutation.isPending,
    [
      addFindingMutation.isPending,
      deleteFindingMutation.isPending,
      updateFindingMutation.isPending,
      upsertResultMutation.isPending,
    ],
  );

  return {
    isMutating,
    upsertResult: (payload: { standardId: string; strengths?: string | null }) =>
      upsertResultMutation.mutateAsync(payload),
    addFinding: (payload: AddExternalReviewFindingRequest) =>
      addFindingMutation.mutateAsync(payload),
    updateFinding: (payload: UpdateExternalReviewFindingRequest) =>
      updateFindingMutation.mutateAsync(payload),
    deleteFinding: (findingId: string) => deleteFindingMutation.mutateAsync(findingId),
  };
}
