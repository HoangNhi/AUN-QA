import { useMemo, useState } from "react";
import { useSurveyCampaign } from "../../hooks/useSurveyCampaign";
import { getColumns } from "./columns";
import PopupSurveyCampaign from "./PopupSurveyCampaign";
import { PopupSession } from "./components/PopupSession";
import { Combobox } from "@/components/ui/combobox";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { useListPage } from "@/hooks/useListPage";

const SurveyCampaignPage = () => {
  const {
    data,
    surveyCampaign,
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
    handleChangeStatus,
    isFetching,
    isLoading,
  } = useSurveyCampaign();

  const [isPopupSessionOpen, setIsPopupSessionOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const showPopupSession = (id: string, name: string) => {
    setSelectedCampaign({ id, name });
    setIsPopupSessionOpen(true);
  };

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        showPopupSession,
        handleChangeStatus,
      ),
    [showPopupDetail, deleteList, showPopupSession, handleChangeStatus],
  );

  const listPage = useListPage({
    data,
    rowSelection,
    pageRequest,
    setPageRequest,
    deleteList,
    setRowSelection,
    defaultPageRequest: { StakeholderType: undefined, CycleId: undefined },
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
      searchInputClassName="col-span-1 md:col-span-2 bg-background"
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
                CycleId: val,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả chu kỳ"
            searchPlaceholder="Tìm kiếm chu kỳ..."
            emptyText="Không tìm thấy chu kỳ."
          />

          <Combobox
            options={STAKEHOLDER_TYPES}
            value={pageRequest.StakeholderType?.toString()}
            onValueChange={(val) => {
              setPageRequest((prev: any) => ({
                ...prev,
                StakeholderType: val ? Number(val) : undefined,
                PageIndex: 1,
              }));
            }}
            placeholder="Tất cả loại đối tượng"
            searchPlaceholder="Tìm kiếm loại đối tượng..."
            emptyText="Không tìm thấy loại đối tượng."
          />
        </>
      }
      onAddClick={() => showPopupDetail("", false)}
      onDeleteClick={() => listPage.setShowDeleteConfirm(true)}
      deleteDisabled={Object.keys(rowSelection).length === 0}
      showDeleteConfirm={listPage.showDeleteConfirm}
      onDeleteConfirmChange={listPage.setShowDeleteConfirm}
      onDeleteConfirm={listPage.handleDelete}
      deleteItemCount={Object.keys(rowSelection).length}
      isDeleteLoading={isLoading}
    >
      {isOpen && (
        <PopupSurveyCampaign
          key={surveyCampaign?.Id || "new"}
          surveyCampaign={surveyCampaign}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
        />
      )}
      <PopupSession
        open={isPopupSessionOpen}
        onOpenChange={setIsPopupSessionOpen}
        campaignId={selectedCampaign?.id || ""}
        campaignName={selectedCampaign?.name}
      />
    </ListPageLayout>
  );
};

export default SurveyCampaignPage;
