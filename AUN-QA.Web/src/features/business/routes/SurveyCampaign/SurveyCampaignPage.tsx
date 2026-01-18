import { useMemo, useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { useSurveyCampaign } from "../../hooks/useSurveyCampaign";
import { getColumns } from "./columns";
import PopupSurveyCampaign from "./PopupSurveyCampaign";
import { DataTable } from "@/components/ui/data-table";
import type { GetPermissionByUser } from "@/features/system/types/role.types";
import { Button } from "@/components/ui/Button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { cycleService } from "@/features/catalog/api/cycle.api";

const SurveyCampaignPage = () => {
  const {
    data,
    surveyCampaign,
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
  } = useSurveyCampaign();

  const { permission } = useOutletContext<{
    permission: GetPermissionByUser | null;
  }>();

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        permission?.IsUpdated ?? true,
        permission?.IsDeleted ?? true,
      ),
    [permission, showPopupDetail, deleteList],
  );

  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track if it's the first render to avoid unnecessary API calls
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debouncedSearchTerm !== pageRequest.TextSearch) {
      setPageRequest({
        ...pageRequest,
        TextSearch: debouncedSearchTerm,
        PageIndex: 1,
      });
    }
  }, [debouncedSearchTerm]);

  // Count selected rows for delete confirmation
  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className="container mx-auto space-y-4">
      {/* Filter Panel */}
      <div className="rounded-lg border bg-muted/40 p-4">
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
                StakeholderType: undefined,
                CycleId: undefined,
              });
              setSearchTerm("");
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Combobox
            fetchOptions={async () => {
              const res = await cycleService.getComboboxByUser();
              return res.Data.map((t) => ({
                Value: t.Value ?? "",
                Text: t.Text ?? "",
              }));
            }}
            value={pageRequest.CycleId}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                CycleId: val,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả chu kỳ"
            searchPlaceholder="Tìm kiếm chu kỳ..."
            emptyText="Không tìm thấy chu kỳ."
          />

          <Combobox
            options={[
              { Value: "1", Text: "Sinh viên" },
              { Value: "2", Text: "Cựu sinh viên" },
              { Value: "3", Text: "Nhà tuyển dụng" },
              { Value: "4", Text: "Giảng viên" },
            ]}
            value={pageRequest.StakeholderType?.toString()}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                StakeholderType: val ? Number(val) : undefined,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả loại đối tượng"
            searchPlaceholder="Tìm kiếm loại đối tượng..."
            emptyText="Không tìm thấy loại đối tượng."
          />

          <InputGroup className="col-span-1 bg-background">
            <InputGroupInput
              placeholder="Tìm kiếm..."
              value={searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!pl-10"
            />
            <InputGroupAddon className="absolute left-0 top-0 h-full px-3 py-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {(permission?.IsAdded ?? true) && (
          <Button size="sm" onClick={() => showPopupDetail("", false)}>
            Thêm
          </Button>
        )}
        {(permission?.IsDeleted ?? true) && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedRowCount === 0}
          >
            Xóa
          </Button>
        )}
      </div>

      {/* DataTable */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedRowCount} mục đã chọn không?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                deleteList(Object.keys(rowSelection));
                setShowDeleteConfirm(false);
                setRowSelection({});
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup for Add/Edit */}
      {isOpen && (
        <PopupSurveyCampaign
          key={surveyCampaign?.Id || "new"}
          surveyCampaign={surveyCampaign}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default SurveyCampaignPage;
