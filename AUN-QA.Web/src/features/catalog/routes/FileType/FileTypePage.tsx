import { useMemo } from "react";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { useOutletContext } from "react-router-dom";
import { useFileType } from "@/features/catalog/hooks/useFileType";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupFileType from "./PopupFileType";

const FileTypePage = () => {
  const {
    data,
    fileType,
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
  } = useFileType();

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
        isLoading={isFetching}
      />
      {isOpen && (
        <PopupFileType
          key={fileType?.Id || "new"}
          fileType={fileType}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
    </div>
  );
};

export default FileTypePage;
