import { useMemo } from "react";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupDetail from "./PopupDetail";
import { useSystemGroup } from "@/features/system/hooks/useSystemGroup";

const SystemGroupPage = () => {
  const {
    data,
    selectedItem,
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
  } = useSystemGroup();

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [deleteList, showPopupDetail],
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
          key={selectedItem?.Id || "new"}
          data={selectedItem}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
    </div>
  );
};

export default SystemGroupPage;
