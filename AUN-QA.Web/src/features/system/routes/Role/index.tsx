import { useMemo, useState } from "react";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupDetail from "./PopupDetail";
import PopupPermission from "./PopupPermission";
import { useRole } from "@/features/system/hooks/useRole";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

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
    isFetching,
  } = useRole();

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList, showPopupPermission),
    [showPopupDetail, deleteList, showPopupPermission],
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    const ids = data.Data.filter((_, idx) => rowSelection[idx]).map(
      (item) => (item as any).Id,
    );
    deleteList(ids);
    setShowDeleteConfirm(false);
    setRowSelection({});
  };

  return (
    <div className="container mx-auto space-y-4">
      <Card className="mb-4 bg-muted/40 shadow-none border-none sm:border-solid p-0">
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium">Lọc danh sách</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => {
                setPageRequest({
                  ...pageRequest,
                  PageIndex: 1,
                  TextSearch: "",
                });
                setSearchTerm("");
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <InputGroup className="col-span-1 bg-background">
              <InputGroupInput
                placeholder="Tìm kiếm..."
                value={searchTerm || ""}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPageRequest({
                      ...pageRequest,
                      TextSearch: searchTerm,
                      PageIndex: 1,
                    });
                  }
                }}
              />
              <InputGroupButton
                onClick={() => {
                  setPageRequest({
                    ...pageRequest,
                    TextSearch: searchTerm,
                    PageIndex: 1,
                  });
                }}
              >
                <SearchIcon />
              </InputGroupButton>
            </InputGroup>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 flex items-center gap-2">
          <Button size="sm" onClick={() => showPopupDetail("", false)}>
            Thêm
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Xóa
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data.Data}
        totalRow={data.TotalRow}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pageRequest={pageRequest}
        setPageRequest={setPageRequest}
        onRefresh={() => getList()}
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
      {isOpenPermission && (
        <PopupPermission
          data={permissionData}
          isOpen={isOpenPermission}
          onOpenChange={onOpenPermissionChange}
          saveChange={savePermission}
        />
      )}
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        itemCount={Object.keys(rowSelection).length}
      />
    </div>
  );
};

export default RolePage;
