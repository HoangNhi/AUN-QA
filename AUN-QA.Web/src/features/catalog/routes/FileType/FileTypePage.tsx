import { useMemo, useState, useEffect } from "react";
import { useFileType } from "@/features/catalog/hooks/useFileType";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupFileType from "./PopupFileType";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { ACTIVE_STATUS_OPTIONS } from "@/constants/catalog.constants";

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
    isLoading,
    isFetching,
  } = useFileType();

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [showPopupDetail, deleteList],
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setPageRequest((prev) => {
      if (prev.TextSearch === debouncedSearchTerm) return prev;
      return {
        ...prev,
        TextSearch: debouncedSearchTerm,
        PageIndex: 1,
      };
    });
  }, [debouncedSearchTerm, setPageRequest]);

  const handleDelete = () => {
    const ids = data.Data.filter((_, idx) => rowSelection[idx]).map(
      (item) => item.Id,
    );
    deleteList(ids);
    setShowDeleteConfirm(false);
    setRowSelection({});
  };

  return (
    <div className="container mx-auto space-y-4">
      <div className="mb-4 rounded-lg border bg-muted/40 p-4">
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
                IsActived: undefined,
              });
              setSearchTerm("");
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Combobox
            options={ACTIVE_STATUS_OPTIONS}
            value={pageRequest.IsActived?.toString()}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                IsActived: val ? val === "true" : undefined,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả trạng thái"
            searchPlaceholder="Tìm kiếm trạng thái..."
            emptyText="Không tìm thấy trạng thái."
          />
          <div className="flex rounded-md shadow-xs col-span-1 bg-background">
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPageRequest((prev) => ({
                    ...prev,
                    TextSearch: searchTerm,
                    PageIndex: 1,
                  }));
                }
              }}
              className="-me-px rounded-r-none shadow-none focus-visible:z-1 pl-3"
            />
            <Button
              onClick={() => {
                setPageRequest((prev) => ({
                  ...prev,
                  TextSearch: searchTerm,
                  PageIndex: 1,
                }));
              }}
              className="rounded-l-none"
            >
              <SearchIcon className="h-4 w-4 mr-1.5" />
            </Button>
          </div>
        </div>
      </div>

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
        <PopupFileType
          key={fileType?.Id || "new"}
          fileType={fileType}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
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

export default FileTypePage;
