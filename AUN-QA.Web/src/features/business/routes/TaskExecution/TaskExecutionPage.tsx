import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useListPage } from "@/hooks/useListPage";
import { useCycleOptions } from "@/features/business/hooks/useCycleOptions";
import { useTaskExecutionPlans } from "./hooks/useTaskExecutionPlans";
import { getTaskExecutionColumns } from "./columns";
import PopupTaskExecution from "./PopupTaskExecution";
import type { TaskExecutionPlanListItem } from "@/features/business/types/taskExecution.types";

export default function TaskExecutionPage() {
  const [mode, setMode] = useState<"my" | "all">("my");
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
    openPopup,
    onOpenChange,
  } = useTaskExecutionPlans(mode);
  const cycleOptions = useCycleOptions();
  const previousModeRef = useRef(mode);

  useEffect(() => {
    if (previousModeRef.current !== mode && selectedItem) {
      onOpenChange(false);
    }
    // Close the popup when switching between personal/all plan views.
    previousModeRef.current = mode;
  }, [mode, onOpenChange, selectedItem]);

  const columns = useMemo<ColumnDef<TaskExecutionPlanListItem>[]>(
    () => getTaskExecutionColumns(openPopup),
    [openPopup],
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
      filterGridCols="md:grid-cols-4"
      searchInputClassName="col-span-1 bg-background"
      filterContent={
        <>
          <div className="md:col-span-2">
            <Tabs value={mode} onValueChange={(value) => setMode(value as "my" | "all")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="my">Kế hoạch của tôi</TabsTrigger>
                <TabsTrigger value="all">Tất cả kế hoạch</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
        </>
      }
      hideAdd
      extraActions={
        <Button size="sm" variant="secondary" onClick={refreshList}>
          Làm mới
        </Button>
      }
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
