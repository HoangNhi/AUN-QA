import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { toast } from "sonner";
import { taskExecutionService } from "@/features/business/api/taskExecution.api";
import type {
  TaskExecutionGetPlansRequest,
  TaskExecutionPlanListItem,
  TaskExecutionPlanListResponse,
} from "@/features/business/types/taskExecution.types";

const EMPTY_LIST: TaskExecutionPlanListResponse = {
  Data: [],
  TotalRow: 0,
  PageIndex: 1,
  PageSize: 10,
};

export function useTaskExecutionPlans(mode: "my" | "all" = "my") {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TaskExecutionPlanListItem | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageRequest, setPageRequest] = useState<TaskExecutionGetPlansRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });

  const queryKey = mode === "my" ? ["task-execution", "my-plans"] : ["task-execution", "all-plans"];

  const {
    data: listResponse,
    isFetching,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: [...queryKey, pageRequest],
    queryFn: async (): Promise<TaskExecutionPlanListResponse> => {
      const response =
        mode === "my"
          ? await taskExecutionService.getMyPlans(pageRequest)
          : await taskExecutionService.getAllPlans(pageRequest);

      if (!response.Success || !response.Data) {
        throw new Error(response.Message || "Không thể tải danh sách kế hoạch thực hiện.");
      }

      return response.Data;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!isError || !error) {
      return;
    }

    toast.error(error instanceof Error ? error.message : "Không thể tải danh sách kế hoạch thực hiện.");
  }, [error, isError]);

  const data = useMemo(() => listResponse ?? EMPTY_LIST, [listResponse]);

  const openPopup = useCallback((item: TaskExecutionPlanListItem) => {
    setSelectedItem(item);
    setIsOpen(true);
  }, []);

  const onOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSelectedItem(null);
        void refetch();
      }
    },
    [refetch],
  );

  const refreshList = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    rowSelection,
    setRowSelection,
    pageRequest,
    setPageRequest,
    isFetching,
    refreshList,
    isOpen,
    selectedItem,
    openPopup,
    onOpenChange,
  };
}
