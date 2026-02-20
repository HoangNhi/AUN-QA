import { useMemo } from "react";
import { useFaculty } from "@/features/catalog/hooks/useFaculty";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import PopupFaculty from "./PopupFaculty";

const FacultyPage = () => {
  const {
    data,
    faculty,
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
  } = useFaculty();

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
        <PopupFaculty
          key={faculty?.Id || "new"}
          faculty={faculty}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
        />
      )}
    </div>
  );
};

export default FacultyPage;
