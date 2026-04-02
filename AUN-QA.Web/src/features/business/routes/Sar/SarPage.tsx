import { useMemo } from "react";
import { Combobox } from "@/components/ui/combobox";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { useListPage } from "@/hooks/useListPage";
import { useSar } from "@/features/business/hooks/useSar";
import { useCycleOptions } from "@/features/business/hooks/useCycleOptions";
import { getColumns } from "./columns";
import PopupSarEditor from "./PopupSarEditor";

const SAR_STATUS_OPTIONS = [
  { Text: "Nháp", Value: "1" },
  { Text: "Đang xử lý", Value: "2" },
  { Text: "Hoàn tất", Value: "3" },
];

export default function SarPage() {
  const {
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
    isSavingDraft,
  } = useSar();

  const cycleOptions = useCycleOptions();
  const columns = useMemo(() => getColumns(showPopupDetail), [showPopupDetail]);

  const listPage = useListPage({
    data,
    rowSelection,
    pageRequest,
    setPageRequest,
    deleteList: () => {
      // SAR demo scope does not include delete.
    },
    setRowSelection,
    defaultPageRequest: {
      Status: undefined,
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
      onRefresh={getList}
      isLoading={isFetching}
      searchTerm={listPage.searchTerm}
      onSearchTermChange={listPage.setSearchTerm}
      onResetFilters={listPage.handleResetFilters}
      hideAdd
      searchInputClassName="col-span-1 bg-background"
      filterGridCols="md:grid-cols-3"
      filterContent={
        <>
          <Combobox
            options={SAR_STATUS_OPTIONS}
            value={pageRequest.Status ? String(pageRequest.Status) : undefined}
            onValueChange={(val) => {
              setPageRequest((prev) => ({
                ...prev,
                Status: val ? Number(val) : undefined,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả trạng thái SAR"
            searchPlaceholder="Tìm trạng thái..."
            emptyText="Không tìm thấy trạng thái."
          />
          <Combobox
            options={cycleOptions.options ?? []}
            value={pageRequest.CycleId ?? undefined}
            onValueChange={(val) => {
              setPageRequest((prev) => ({
                ...prev,
                CycleId: val || undefined,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả chu kỳ"
            searchPlaceholder="Tìm chu kỳ..."
            emptyText="Không tìm thấy chu kỳ."
          />
        </>
      }
    >
      {isOpen && selectedSar && (
        <PopupSarEditor
          open={isOpen}
          onOpenChange={onOpenChange}
          cycle={selectedSar}
          draft={draft}
          isDraftLoading={isDraftFetching}
          isSavingDraft={isSavingDraft}
          onRefreshDraft={() => {
            void refetchDraft();
          }}
          onSaveDraft={saveDraft}
        />
      )}
    </ListPageLayout>
  );
}
