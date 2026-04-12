import { useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { useListPage } from "@/hooks/useListPage";
import { useAuth } from "@/hooks/useAuth";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";
import { useCycleOptions } from "@/features/business/hooks/useCycleOptions";
import { useSurveyCampaign } from "../../hooks/useSurveyCampaign";
import { getColumns } from "./columns";
import PopupSurveyCampaign from "./PopupSurveyCampaign";
import { PopupSession } from "./components/PopupSession";

const SurveyCampaignPage = () => {
  const { isExternalReviewer } = useAuth();
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
        isExternalReviewer,
      ),
    [
      deleteList,
      handleChangeStatus,
      isExternalReviewer,
      showPopupDetail,
      showPopupSession,
    ],
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

  const { options: cycleOptions, isLoading: isCycleLoading } =
    useCycleOptions();

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
      searchInputClassName="col-span-1 bg-background md:col-span-2"
      filterContent={
        <>
          <Combobox
            options={cycleOptions}
            loading={isCycleLoading}
            value={pageRequest.CycleId}
            onValueChange={(val) => {
              setPageRequest((prev) => ({
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
              setPageRequest((prev) => ({
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
      hideAdd={isExternalReviewer}
      onAddClick={
        isExternalReviewer
          ? undefined
          : () => {
              showPopupDetail("", false);
            }
      }
      onDeleteClick={
        isExternalReviewer
          ? undefined
          : () => {
              listPage.setShowDeleteConfirm(true);
            }
      }
      deleteDisabled={Object.keys(rowSelection).length === 0}
      showDeleteConfirm={listPage.showDeleteConfirm}
      onDeleteConfirmChange={listPage.setShowDeleteConfirm}
      onDeleteConfirm={listPage.handleDelete}
      deleteItemCount={Object.keys(rowSelection).length}
      isDeleteLoading={isLoading}
    >
      {isOpen && surveyCampaign && (
        <PopupSurveyCampaign
          key={surveyCampaign?.Id || "new"}
          surveyCampaign={surveyCampaign}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
          readOnly={isExternalReviewer}
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
