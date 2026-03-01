import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEvidenceCycleMap } from "../../hooks/useEvidenceCycleMap";
import { getColumns } from "./columns";
import PopupEvidenceCycleMap from "./PopupEvidenceCycleMap";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { EVIDENCE_STATUS_OPTIONS } from "@/constants/business.constants";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { useListPage } from "@/hooks/useListPage";

const EvidenceCycleMapPage = () => {
  const {
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
    submitToApprove,
    approve,
    isFetching,
    isLoading,
    isApproving,
  } = useEvidenceCycleMap();

  const { data: fileTypesData } = useQuery({
    queryKey: ["fileTypesCombobox"],
    queryFn: () => fileTypeService.getAllCombobox(),
  });
  const fileTypeMap = useMemo<Record<string, string>>(() => {
    return Object.fromEntries(
      (fileTypesData?.Data ?? []).map((t: any) => [t.Value ?? "", t.Text ?? ""]),
    );
  }, [fileTypesData]);

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList, fileTypeMap),
    [showPopupDetail, deleteList, fileTypeMap],
  );

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const listPage = useListPage({
    data,
    rowSelection,
    pageRequest,
    setPageRequest,
    deleteList,
    setRowSelection,
    defaultPageRequest: {
      CycleId: undefined,
      FileTypeId: undefined,
      EvidenceStatus: undefined,
    },
  });

  const handleSubmitToApprove = () => {
    const ids = data.Data.filter((_, idx) => rowSelection[idx]).map(
      (item) => item.Id,
    );
    submitToApprove(ids);
    setShowSubmitConfirm(false);
    setRowSelection({});
  };

  const selectedCount = Object.keys(rowSelection).length;

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
      searchInputClassName="col-span-1 bg-background"
      filterContent={
        <>
          <Combobox
            fetchOptions={async () => {
              const res = await cycleService.getComboboxByUser();
              return (res.Data || []).map((t: any) => ({
                Value: t.Value ?? "",
                Text: t.Text ?? "",
              }));
            }}
            value={pageRequest.CycleId}
            onValueChange={(val) => {
              setPageRequest((prev: any) => ({
                ...prev,
                CycleId: val ? val : undefined,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả chu kỳ"
            searchPlaceholder="Tìm kiếm chu kỳ..."
            emptyText="Không tìm thấy chu kỳ."
          />

          <Combobox
            fetchOptions={async () => {
              const res = await fileTypeService.getAllCombobox();
              return (res.Data || []).map((t: any) => ({
                Value: t.Value ?? "",
                Text: t.Text ?? "",
              }));
            }}
            value={pageRequest.FileTypeId}
            onValueChange={(val) => {
              setPageRequest((prev: any) => ({
                ...prev,
                FileTypeId: val ? val : undefined,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả loại tài liệu"
            searchPlaceholder="Tìm kiếm loại tài liệu..."
            emptyText="Không tìm thấy loại tài liệu."
          />

          <Combobox
            options={EVIDENCE_STATUS_OPTIONS}
            value={pageRequest.EvidenceStatus?.toString()}
            onValueChange={(val) => {
              setPageRequest((prev: any) => ({
                ...prev,
                EvidenceStatus: val ? Number(val) : undefined,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả trạng thái minh chứng"
            searchPlaceholder="Tìm kiếm trạng thái minh chứng..."
            emptyText="Không tìm thấy trạng thái."
          />
        </>
      }
      onAddClick={() => showPopupDetail("", false)}
      onDeleteClick={() => listPage.setShowDeleteConfirm(true)}
      deleteDisabled={selectedCount === 0}
      showDeleteConfirm={listPage.showDeleteConfirm}
      onDeleteConfirmChange={listPage.setShowDeleteConfirm}
      onDeleteConfirm={listPage.handleDelete}
      deleteItemCount={selectedCount}
      isDeleteLoading={isLoading}
      extraActions={
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowSubmitConfirm(true)}
          disabled={selectedCount === 0}
        >
          Gửi duyệt
        </Button>
      }
    >
      {isOpen && (
        <PopupEvidenceCycleMap
          key={evidenceCycleMap?.Id || "new"}
          evidenceCycleMap={evidenceCycleMap}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
          onApprove={approve}
          isApproving={isApproving}
        />
      )}

      <ConfirmDeleteDialog
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        onConfirm={handleSubmitToApprove}
        itemCount={selectedCount}
        title="Xác nhận gửi duyệt"
        description={`Bạn có chắc chắn muốn gửi ${selectedCount} mục đã chọn để duyệt không?`}
        confirmText="Gửi duyệt"
        confirmVariant="default"
      />
    </ListPageLayout>
  );
};

export default EvidenceCycleMapPage;
