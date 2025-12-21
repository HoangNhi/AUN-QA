import { useMemo } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import { useOutletContext } from "react-router-dom";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import PopupDetail from "./PopupDetail";
import PopupPermission from "./PopupPermission";
import { useRole } from "@/features/system/hooks/useRole";

const RolePage = () => {
  const {
    data,
    selectedItem,
    isOpen,
    isOpenPermission,
    permissionData,
    pageRequest,
    rowSelection,
    setPageRequest,
    setRowSelection,
    getList,
    showPopupDetail,
    showPopupPermission,
    onOpenChange,
    onOpenPermissionChange,
    saveChange,
    savePermission,
    deleteList,
  } = useRole();

  const { permission } = useOutletContext<{
    permission: GetPermissionByUser | null;
  }>();

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        showPopupPermission,
        permission?.IsUpdated,
        permission?.IsDeleted
      ),
    [showPopupDetail, deleteList, showPopupPermission, permission]
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
        <PopupDetail
          key={selectedItem?.Id || "new"}
          data={selectedItem}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
      {isOpenPermission && (
        <PopupPermission
          data={permissionData}
          isOpen={isOpenPermission}
          onOpenChange={onOpenPermissionChange}
          saveChange={savePermission}
        />
      )}
    </div>
  );
};

export default RolePage;
