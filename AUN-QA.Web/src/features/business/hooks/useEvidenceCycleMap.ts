import { useState, useCallback, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { evidenceCycleMapService } from "@/features/business/api/evidenceCycleMap.api";
import type {
  EvidenceCycleMap,
  EvidenceCycleMapGetListPagingRequest,
} from "@/features/business/types/evidence.types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { RowSelectionState } from "@tanstack/react-table";

export const useEvidenceCycleMap = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [evidenceCycleMap, setEvidenceCycleMap] = useState<EvidenceCycleMap | null>(null);
  const [pageRequest, setPageRequest] = useState<EvidenceCycleMapGetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 1. Fetch List
  const {
    data: listResponse,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["evidenceCycleMaps", pageRequest],
    queryFn: () => evidenceCycleMapService.getList(pageRequest),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (listResponse && !listResponse.Success) {
      toast.error(listResponse.Message);
    }
  }, [listResponse]);

  const data = listResponse?.Data || {
    Data: [],
    TotalRow: 0,
    PageIndex: 1,
    PageSize: 10,
  };

  // 2. Mutations
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data: EvidenceCycleMap) => {
      return data.IsEdit
        ? evidenceCycleMapService.update(data)
        : evidenceCycleMapService.insert(data);
    },
    onSuccess: (response, variables) => {
      if (response.Success) {
        toast.success(
          variables.IsEdit ? "Cập nhật thành công" : "Thêm mới thành công"
        );
        queryClient.invalidateQueries({ queryKey: ["evidenceCycleMaps"] });
      } else {
        toast.error(response.Message);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi lưu dữ liệu"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => evidenceCycleMapService.deleteList(ids),
    onSuccess: (response) => {
      if (response.Success) {
        toast.success("Xóa dữ liệu thành công");
        queryClient.invalidateQueries({ queryKey: ["evidenceCycleMaps"] });
        setRowSelection({});
      } else {
        toast.error(response.Message);
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi xóa dữ liệu"
      );
    },
  });

  // 3. Handlers
  const getList = useCallback(() => {
    refetch();
  }, [refetch]);

  const showPopupDetail = useCallback(async (id: string, isEdit: boolean) => {
    if (isEdit) {
      const response = await evidenceCycleMapService.getById(id);
      if (response?.Success && response?.Data) {
        setEvidenceCycleMap({ ...response.Data, IsEdit: isEdit });
        setIsOpen(true);
      } else {
        toast.error(response?.Message);
      }
    } else {
      setEvidenceCycleMap({
        Id: id,
        EvidenceId: "",
        CycleId: "",
        ReviewStatus: 1,
        Name: "",
        Code: "",
        Status: 1,
        FileTypeId: "",
        IsEdit: isEdit,
        IsActived: true,
      });
      setIsOpen(true);
    }
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setEvidenceCycleMap(null);
  }, []);

  const saveChange = async (saveData: EvidenceCycleMap, isAddMore: boolean) => {
    const result = await saveMutation.mutateAsync(saveData);
    if (result.Success) {
      if (isAddMore) {
        setEvidenceCycleMap({
          Id: uuidv4(),
          EvidenceId: "",
          CycleId: "",
          ReviewStatus: 1,
          Name: "",
          Code: "",
          Status: 1,
          FileTypeId: "",
          IsEdit: false,
          IsActived: true,
        });
      } else {
        setIsOpen(false);
        setEvidenceCycleMap(null);
      }
    }
  };

  const deleteList = async (ids: string[]) => {
    await deleteMutation.mutateAsync(ids);
  };

  return {
    data,
    evidenceCycleMap,
    isOpen,
    pageRequest,
    rowSelection,
    setPageRequest,
    setRowSelection,
    getList,
    showPopupDetail,
    onOpenChange,
    saveChange,
    deleteList,
    isLoading: saveMutation.isPending || deleteMutation.isPending,
    isFetching,
  };
};
