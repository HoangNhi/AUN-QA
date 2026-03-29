import { useCallback, useEffect, useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { RowSelectionState } from "@tanstack/react-table";
import { sarService } from "../api/sar.api";
import type {
  SarDraft,
  SarGetListItem,
  SarGetListPagingRequest,
  SaveSarDraftRequest,
} from "../types/sar.types";

const EMPTY_LIST = {
  Data: [] as SarGetListItem[],
  TotalRow: 0,
  PageIndex: 1,
  PageSize: 10,
};

export const useSar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSar, setSelectedSar] = useState<SarGetListItem | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageRequest, setPageRequest] = useState<SarGetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });

  const {
    data: listResponse,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["sar", "list", pageRequest],
    queryFn: () => sarService.getList(pageRequest),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (listResponse && !listResponse.Success) {
      toast.error(listResponse.Message || "Không thể tải danh sách SAR");
    }
  }, [listResponse]);

  const data = listResponse?.Data ?? EMPTY_LIST;

  const {
    data: draftResponse,
    isFetching: isDraftFetching,
    refetch: refetchDraft,
  } = useQuery({
    queryKey: ["sar", "draft", selectedSar?.CycleId],
    queryFn: () => {
      if (!selectedSar) {
        throw new Error("Không có cycle để tải bản nháp SAR");
      }

      return sarService.getByCycle({ CycleId: selectedSar.CycleId });
    },
    enabled: isOpen && !!selectedSar?.CycleId,
  });

  useEffect(() => {
    if (draftResponse && !draftResponse.Success) {
      toast.error(draftResponse.Message || "Không thể tải nội dung SAR");
    }
  }, [draftResponse]);

  const draft = useMemo<SarDraft | null>(() => {
    return draftResponse?.Data ?? null;
  }, [draftResponse]);

  const saveDraftMutation = useMutation({
    mutationFn: (request: SaveSarDraftRequest) => sarService.saveDraft(request),
    onSuccess: (response) => {
      if (!response.Success) {
        toast.error(response.Message || "Không thể lưu bản nháp SAR");
        return;
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu bản nháp SAR",
      );
    },
  });

  const showPopupDetail = useCallback((item: SarGetListItem) => {
    setSelectedSar(item);
    setIsOpen(true);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedSar(null);
      void refetch();
    }
  }, [refetch]);

  const getList = useCallback(() => {
    void refetch();
  }, [refetch]);

  const saveDraft = useCallback(
    async (request: SaveSarDraftRequest) => {
      const response = await saveDraftMutation.mutateAsync(request);
      return response.Success;
    },
    [saveDraftMutation],
  );

  return {
    data,
    rowSelection,
    setRowSelection,
    pageRequest,
    setPageRequest,
    getList,
    isFetching,
    isOpen,
    selectedSar,
    showPopupDetail,
    onOpenChange,
    draft,
    isDraftFetching,
    refetchDraft,
    saveDraft,
    isSavingDraft: saveDraftMutation.isPending,
  };
};
