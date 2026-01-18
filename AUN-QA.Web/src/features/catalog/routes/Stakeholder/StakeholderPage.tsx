import { useMemo, useState, useEffect } from "react";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { useOutletContext } from "react-router-dom";
import { useStakeholder } from "@/features/catalog/hooks/useStakeholder";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupStakeholder from "./PopupStakeholder";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  const { permission } = useOutletContext<{
    permission: GetPermissionByUser | null;
  }>();

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        permission?.IsUpdated,
        permission?.IsDeleted,
      ),
    [permission, showPopupDetail, deleteList],
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [typeTerm, setTypeTerm] = useState<string | undefined>(
    pageRequest.Type?.toString(),
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (debouncedSearchTerm !== pageRequest.TextSearch) {
      setPageRequest({
        ...pageRequest,
        TextSearch: debouncedSearchTerm,
        PageIndex: 1,
      });
    }
  }, [debouncedSearchTerm, pageRequest, setPageRequest]);

  const canAdd = permission?.IsAdded;
  const canDelete = permission?.IsDeleted;

  const handleDelete = () => {
    const ids = data.Data.filter((_, idx) => rowSelection[idx]).map(
      (item: any) => item.Id,
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
              });
              setSearchTerm("");
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select
            value={typeTerm ?? "null"}
            onValueChange={(value) => {
              const newValue = value === "null" ? undefined : value;
              setTypeTerm(newValue);
              setPageRequest({
                ...pageRequest,
                Type: newValue ? Number(newValue) : undefined,
                PageIndex: 1,
              });
            }}
          >
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="-- Tất cả loại đối tượng --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">-- Tất cả loại đối tượng --</SelectItem>
              <SelectItem value="1">Sinh viên</SelectItem>
              <SelectItem value="2">Cựu sinh viên</SelectItem>
              <SelectItem value="4">Giảng viên</SelectItem>
              <SelectItem value="3">Nhà tuyển dụng</SelectItem>
            </SelectContent>
          </Select>
          <InputGroup className="col-span-1 bg-background">
            <InputGroupInput
              placeholder="Tìm kiếm..."
              value={searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10!"
            />
            <InputGroupAddon className="absolute left-0 top-0 h-full px-3 py-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 flex items-center gap-2">
          {canAdd && (
            <Button size="sm" onClick={() => showPopupDetail("", false)}>
              Thêm
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={Object.keys(rowSelection).length === 0}
            >
              Xóa
            </Button>
          )}
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
        onRefresh={() => getList(pageRequest)}
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

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {Object.keys(rowSelection).length} mục
              đã chọn không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StakeholderPage;
