import { useMemo, useState, useEffect } from "react";
import { useStakeholder } from "@/features/catalog/hooks/useStakeholder";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupStakeholder from "./PopupStakeholder";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";

const StakeholderPage = () => {
  const {
    data,
    stakeholder,
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
  } = useStakeholder();

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
    setRowSelection({}); // Clear selection
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
                TextSearch: "",
                Type: undefined,
                PageIndex: 1,
              });
              setSearchTerm("");
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Combobox
            options={STAKEHOLDER_TYPES}
            value={pageRequest.Type?.toString()}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                Type: val ? Number(val) : undefined,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả loại đối tượng"
            searchPlaceholder="Tìm kiếm loại đối tượng..."
            emptyText="Không tìm thấy loại đối tượng."
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
        <PopupStakeholder
          key={stakeholder?.Id || "new"}
          stakeholder={stakeholder}
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

export default StakeholderPage;
