import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useSurveyCampaign } from "../../hooks/useSurveyCampaign";
import { getColumns } from "./columns";
import PopupSurveyCampaign from "./PopupSurveyCampaign";
import { DataTable } from "./data-table";
import type { GetPermissionByUser } from "@/features/system/types/role.types";

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
    isFetching,
    isLoading,
  } = useSurveyCampaign();

  const { permission } = useOutletContext<{
    permission: GetPermissionByUser | null;
  }>();

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        permission?.IsUpdated ?? true,
        permission?.IsDeleted ?? true,
      ),
    [permission, showPopupDetail, deleteList],
  );

  return (
    <div className="container mx-auto">
      <DataTable
        columns={columns}
        data={data.Data}
        totalRow={data.TotalRow}
        showPopupDetail={showPopupDetail}
        deleteList={deleteList}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pageRequest={pageRequest}
        setPageRequest={setPageRequest}
        getList={getList}
        canAdd={permission?.IsAdded ?? true}
        canDelete={permission?.IsDeleted ?? true}
        isLoading={isFetching}
        searchTerm={pageRequest.TextSearch}
        setSearchTerm={(term: string) =>
          setPageRequest({ ...pageRequest, TextSearch: term })
        }
      />
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
    </div>
  );
};

export default SurveyCampaignPage;
