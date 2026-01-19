import { useState, useCallback, useEffect } from "react";
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { criterionService } from "@/features/catalog/api/criterion.api";
import type { Criterion } from "@/features/catalog/types/criterion.types";
import type { GetListPagingRequest } from "@/types/base/base.types";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import type { RowSelectionState } from "@tanstack/react-table";

export const useCriterion = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [criterion, setCriterion] = useState<Criterion | null>(null);
    const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
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
        queryKey: ["criteria", pageRequest],
        queryFn: () => criterionService.getList(pageRequest),
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
        mutationFn: (data: Criterion) => {
            return data.IsEdit
                ? criterionService.update(data)
                : criterionService.insert(data);
        },
        onSuccess: (response, variables) => {
            if (response.Success) {
                toast.success(
                    variables.IsEdit ? "Cập nhật thành công" : "Thêm mới thành công"
                );
                queryClient.invalidateQueries({ queryKey: ["criteria"] });
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
        mutationFn: (ids: string[]) => criterionService.deleteList(ids),
        onSuccess: (response) => {
            if (response.Success) {
                toast.success("Xóa dữ liệu thành công");
                queryClient.invalidateQueries({ queryKey: ["criteria"] });
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
            const response = await criterionService.getById(id);
            if (response?.Success && response?.Data) {
                setCriterion({ ...response.Data, IsEdit: isEdit });
                setIsOpen(true);
            } else {
                toast.error(response?.Message);
            }
        } else {
            setCriterion({
                Id: id,
                StandardId: "",
                StandardName: "",
                Code: "",
                Name: "",
                Description: "",
                Guidance: "",
                IsEdit: isEdit
            });
            setIsOpen(true);
        }
    }, []);

    const onOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setCriterion(null);
        }
    }, []);

    const saveChange = async (saveCriterion: Criterion, isAddMore: boolean) => {
        const result = await saveMutation.mutateAsync(saveCriterion);
        if (result.Success) {
            if (isAddMore) {
                setCriterion({
                    Id: uuidv4(),
                    StandardId: saveCriterion.StandardId, // Keep same standard
                    StandardName: "",
                    Code: "",
                    Name: "",
                    Description: "",
                    Guidance: "",
                    IsEdit: false,
                });
            } else {
                setIsOpen(false);
                setCriterion(null);
            }
        }
    };

    const deleteList = async (ids: string[]) => {
        await deleteMutation.mutateAsync(ids);
    };

    return {
        data,
        criterion,
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
