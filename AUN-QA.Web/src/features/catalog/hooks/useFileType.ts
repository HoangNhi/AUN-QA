import { useState, useCallback, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import type {
  FileType,
  FileTypeGetListPagingRequest,
} from "@/features/catalog/types/filetype.types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { RowSelectionState } from "@tanstack/react-table";

export const useFileType = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileType, setFileType] = useState<FileType | null>(null);
  const [pageRequest, setPageRequest] =
    useState<FileTypeGetListPagingRequest>({
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
    queryKey: ["fileTypes", pageRequest],
    queryFn: () => fileTypeService.getList(pageRequest),
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
    mutationFn: (data: FileType) => {
      return data.IsEdit
        ? fileTypeService.update(data)
        : fileTypeService.insert(data);
    },
    onSuccess: (response, variables) => {
      if (response.Success) {
        toast.success(
          variables.IsEdit ? "Cập nhật thành công" : "Thêm mới thành công"
        );
        queryClient.invalidateQueries({ queryKey: ["fileTypes"] });
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
    mutationFn: (ids: string[]) => fileTypeService.deleteList(ids),
    onSuccess: (response) => {
      if (response.Success) {
        toast.success("Xóa dữ liệu thành công");
        queryClient.invalidateQueries({ queryKey: ["fileTypes"] });
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
      const response = await fileTypeService.getById(id);
      if (response?.Success && response?.Data) {
        setFileType({ ...response.Data, IsEdit: isEdit });
        setIsOpen(true);
      } else {
        toast.error(response?.Message);
      }
    } else {
      setFileType({ Id: id, Code: "", Name: "", IsEdit: isEdit });
      setIsOpen(true);
    }
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setFileType(null);
    }
  }, []);

  const saveChange = async (saveFileType: FileType, isAddMore: boolean) => {
    const result = await saveMutation.mutateAsync(saveFileType);
    if (result.Success) {
      if (isAddMore) {
        setFileType({
          Id: uuidv4(),
          Code: "",
          Name: "",
          IsEdit: false,
        });
      } else {
        setIsOpen(false);
        setFileType(null);
      }
    }
  };

  const deleteList = async (ids: string[]) => {
    await deleteMutation.mutateAsync(ids);
  };

  return {
    data,
    fileType,
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
