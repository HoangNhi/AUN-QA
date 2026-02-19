import { useMemo } from "react";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { useOutletContext } from "react-router-dom";
import { useEvidence } from "@/features/business/hooks/useEvidence";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupEvidence from "./PopupEvidence";

const EvidencePage = () => {
  const {
    data,
    evidence,
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
    onApprove,
    isLoading,
    isSubmitting,
    isApproving,
    isFetching,
  } = useEvidence();

  const { permission } = useOutletContext<{
    permission: GetPermissionByUser | null;
  }>();

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        permission?.IsUpdated,
        permission?.IsDeleted
      ),
    [permission, showPopupDetail, deleteList]
  );

  return (
    <div className="container mx-auto ">
      <DataTable
        columns={columns}
        data={data.Data}
        totalRow={data.TotalRow}
        showPopupDetail={showPopupDetail}
        deleteList={deleteList}
        submitToApprove={submitToApprove}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pageRequest={pageRequest}
        setPageRequest={setPageRequest}
        getList={getList}
        canAdd={permission?.IsAdded}
        canDelete={permission?.IsDeleted}
        isLoading={isFetching}
        isSubmitting={isSubmitting}
      />
      {isOpen && (
        <PopupEvidence
          key={evidence?.Id || "new"}
          evidence={evidence}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
          onApprove={onApprove}
          isApproving={isApproving}
        />
      )}
    </div>
  );
};

export default EvidencePage;
