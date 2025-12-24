import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { evidenceService } from "@/features/business/api/evidence.api";
import type { Evidence } from "@/features/business/types/evidence.types";
import type {
  GetListPagingRequest,
} from "@/types/base/base.types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { RowSelectionState } from "@tanstack/react-table";

export const useEvidence = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 1. Fetch List
  const { data: listResponse, refetch } = useQuery({
    queryKey: ["evidences", pageRequest],
    queryFn: () => evidenceService.getList(pageRequest),
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
    mutationFn: (data: Evidence) => {
      return data.IsEdit ? evidenceService.update(data) : evidenceService.insert(data);
    },
    onSuccess: (response, variables) => {
      if (response.Success) {
        toast.success(variables.IsEdit ? "Cập nhật thành công" : "Thêm mới thành công");
        queryClient.invalidateQueries({ queryKey: ["evidences"] });
      } else {
        toast.error(response.Message);
      }
    },
    onError: (error) => {
       toast.error(error instanceof Error ? error.message : "Lỗi khi lưu dữ liệu");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => evidenceService.deleteList(ids),
    onSuccess: (response) => {
       if (response.Success) {
         toast.success("Xóa dữ liệu thành công");
         queryClient.invalidateQueries({ queryKey: ["evidences"] });
         setRowSelection({});
       } else {
         toast.error(response.Message);
       }
    },
    onError: (error) => {
       toast.error(error instanceof Error ? error.message : "Lỗi khi xóa dữ liệu");
    }
  });

  // 3. Handlers
  const getList = useCallback(() => {
    refetch();
  }, [refetch]);

  const showPopupDetail = useCallback(async (id: string, isEdit: boolean) => {
    if (isEdit) {
      const response = await evidenceService.getById(id);
      if (response?.Success && response?.Data) {
        setEvidence({ ...response.Data, IsEdit: isEdit });
        setIsOpen(true);
      } else {
        toast.error(response?.Message);
      }
    } else {
      setEvidence({ Id: id, Name: "", IsEdit: isEdit });
      setIsOpen(true);
    }
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setEvidence(null);
  }, []);

  const saveChange = async (saveEvidence: Evidence, isAddMore: boolean) => {
     const result = await saveMutation.mutateAsync(saveEvidence);
     if (result.Success) {
        if (isAddMore) {
           setEvidence({
             Id: uuidv4(),
             Name: "",
             IsEdit: false,
           });
        } else {
           setIsOpen(false);
           setEvidence(null);
        }
     }
  };

  const deleteList = async (ids: string[]) => {
      await deleteMutation.mutateAsync(ids);
  };

  return {
    data,
    evidence,
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
    isLoading: saveMutation.isPending || deleteMutation.isPending
  };
};
