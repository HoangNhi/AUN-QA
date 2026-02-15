import { useMemo, useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useEvidenceCycleMap } from "../../hooks/useEvidenceCycleMap";
import { getColumns } from "./columns";
import PopupEvidenceCycleMap from "./PopupEvidenceCycleMap";
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
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { EVIDENCE_CYCLE_MAP_REVIEW_STATUS_OPTIONS, EVIDENCE_STATUS_OPTIONS } from "@/constants/business.constants";

const EvidenceCycleMapPage = () => {
  const {
    data,
    evidenceCycleMap,
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
  } = useEvidenceCycleMap();

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

  const canAdd = permission?.IsAdded;
  const canDelete = permission?.IsDeleted;

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
                ReviewStatus: undefined,
                CycleId: undefined,
                EvidenceStatus: undefined,
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
              return (res.Data || []).map((t) => ({
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
            options={EVIDENCE_CYCLE_MAP_REVIEW_STATUS_OPTIONS}
            value={pageRequest.ReviewStatus?.toString()}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                ReviewStatus: val ? Number(val) : undefined,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả trạng thái duyệt"
            searchPlaceholder="Tìm kiếm trạng thái duyệt..."
            emptyText="Không tìm thấy trạng thái."
          />

          <Combobox
            options={EVIDENCE_STATUS_OPTIONS}
            value={pageRequest.EvidenceStatus?.toString()}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                EvidenceStatus: val ? Number(val) : undefined,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả trạng thái minh chứng"
            searchPlaceholder="Tìm kiếm trạng thái minh chứng..."
            emptyText="Không tìm thấy trạng thái."
          />

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
        onRefresh={() => getList()}
        isLoading={isFetching}
      />

      {isOpen && (
        <PopupEvidenceCycleMap
          key={evidenceCycleMap?.Id || "new"}
          evidenceCycleMap={evidenceCycleMap}
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

export default EvidenceCycleMapPage;
