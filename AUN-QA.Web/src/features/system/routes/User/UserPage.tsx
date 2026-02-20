import { useMemo } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupDetail from "./PopupDetail";
import { useUser } from "@/features/system/hooks/useUser";

const UserPage = () => {
  const {
    data,
    user,
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
  } = useUser();

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [showPopupDetail, deleteList],
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
        isLoading={isFetching}
      />
      {isOpen && (
        <PopupDetail
          key={user?.Id || "new"}
          user={user}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
    </div>
  );
};

export default UserPage;
