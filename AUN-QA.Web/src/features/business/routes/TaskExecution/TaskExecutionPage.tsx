import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Combobox } from "@/components/ui/combobox";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { useListPage } from "@/hooks/useListPage";
import { useCycleOptions } from "@/features/business/hooks/useCycleOptions";
import { useTaskExecutionPlans } from "./hooks/useTaskExecutionPlans";
import { getTaskExecutionColumns } from "./columns";
import PopupTaskExecution from "./PopupTaskExecution";
import type { TaskExecutionPlanListItem } from "@/features/business/types/taskExecution.types";

export default function TaskExecutionPage() {
  const {
    data,
    rowSelection,
    setRowSelection,
    pageRequest,
    setPageRequest,
    isFetching,
    refreshList,
    isOpen,
    selectedItem,
    loadingItemId,
    openPopup,
    onOpenChange,
  } = useTaskExecutionPlans();
  const cycleOptions = useCycleOptions();

  const columns = useMemo<ColumnDef<TaskExecutionPlanListItem>[]>(
    () => getTaskExecutionColumns(openPopup, loadingItemId),
    [loadingItemId, openPopup],
  );

  const listPage = useListPage({
    data,
    rowSelection,
    pageRequest,
    setPageRequest,
    deleteList: () => {
      // TaskExecution không có thao tác xóa hàng loạt ở màn danh sách.
    },
    setRowSelection,
    defaultPageRequest: {
      CycleId: undefined,
    },
  });

  return (
    <ListPageLayout
      columns={columns}
      data={data.Data}
      totalRow={data.TotalRow}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
      pageRequest={pageRequest}
      setPageRequest={setPageRequest}
      onRefresh={refreshList}
      isLoading={isFetching}
      searchTerm={listPage.searchTerm}
      onSearchTermChange={listPage.setSearchTerm}
      onResetFilters={listPage.handleResetFilters}
      filterGridCols="md:grid-cols-3"
      searchInputClassName="col-span-1 bg-background"
      filterContent={
        <Combobox
          options={cycleOptions.options ?? []}
          loading={cycleOptions.isLoading}
          value={pageRequest.CycleId ?? undefined}
          onValueChange={(value) =>
            setPageRequest((prev) => ({
              ...prev,
              CycleId: value || undefined,
              PageIndex: 1,
            }))
          }
          placeholder="Tất cả chu kỳ"
          searchPlaceholder="Tìm chu kỳ..."
          emptyText="Không tìm thấy chu kỳ."
        />
      }
      hideAdd
    >
      {isOpen && selectedItem ? (
        <PopupTaskExecution
          open={isOpen}
          item={selectedItem}
          onOpenChange={onOpenChange}
          onChanged={refreshList}
        />
      ) : null}
    </ListPageLayout>
  );
}
