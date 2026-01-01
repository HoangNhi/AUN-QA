import { useMemo } from "react";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { useOutletContext } from "react-router-dom";
import { useCycle } from "@/features/catalog/hooks/useCycle";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupCycle from "./PopupCycle";

const CyclePage = () => {
  const {
    data,
    cycle,
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
  } = useCycle();

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
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pageRequest={pageRequest}
        setPageRequest={setPageRequest}
        getList={getList}
        canAdd={permission?.IsAdded}
        canDelete={permission?.IsDeleted}
      />
      {isOpen && (
        <PopupCycle
          key={cycle?.Id || "new"}
          cycle={cycle}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
    </div>
  );
};

export default CyclePage;
