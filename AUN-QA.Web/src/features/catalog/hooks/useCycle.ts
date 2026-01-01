import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { cycleService } from "@/features/catalog/api/cycle.api";
import type { Cycle, CycleRequest } from "@/features/catalog/types/cycle.types";
import type {
  GetListPagingRequest,
} from "@/types/base/base.types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { RowSelectionState } from "@tanstack/react-table";

export const useCycle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 1. Fetch List
  const { data: listResponse, refetch } = useQuery({
    queryKey: ["cycles", pageRequest],
    queryFn: () => cycleService.getList(pageRequest),
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
    mutationFn: (data: CycleRequest) => {
      return data.Id && cycle?.IsEdit ? cycleService.update(data) : cycleService.insert(data);
    },
    onSuccess: (response) => {
      if (response.Success) {
        toast.success(cycle?.IsEdit ? "Cập nhật thành công" : "Thêm mới thành công");
        queryClient.invalidateQueries({ queryKey: ["cycles"] });
      } else {
        toast.error(response.Message);
      }
    },
    onError: (error) => {
       toast.error(error instanceof Error ? error.message : "Lỗi khi lưu dữ liệu");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => cycleService.deleteList(ids),
    onSuccess: (response) => {
       if (response.Success) {
         toast.success("Xóa dữ liệu thành công");
         queryClient.invalidateQueries({ queryKey: ["cycles"] });
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
      const response = await cycleService.getById(id);
      if (response?.Success && response?.Data) {
        setCycle({ ...response.Data, IsEdit: isEdit });
        setIsOpen(true);
      } else {
        toast.error(response?.Message);
      }
    } else {
      setCycle({ 
          Id: id, 
          Name: "", 
          Year: new Date().getFullYear(),
          StartDate: new Date().toISOString(),
          EndDate: new Date().toISOString(),
          Status: "Planning",
          EvaluationPurpose: "",
          Scope: 1,
          IsEdit: isEdit 
      });
      setIsOpen(true);
    }
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) setCycle(null);
  }, []);

  const saveChange = async (saveCycle: CycleRequest, isAddMore: boolean) => {
     const result = await saveMutation.mutateAsync(saveCycle);
     if (result.Success) {
        if (isAddMore) {
           setCycle({
             Id: uuidv4(),
             Name: "",
             Year: new Date().getFullYear(),
             StartDate: new Date().toISOString(),
             EndDate: new Date().toISOString(),
             Status: "Planning",
             EvaluationPurpose: "",
             Scope: 1,
             IsEdit: false,
           });
        } else {
           setIsOpen(false);
           setCycle(null);
        }
     }
  };

  const deleteList = async (ids: string[]) => {
      await deleteMutation.mutateAsync(ids);
  };

  return {
    data,
    cycle,
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
