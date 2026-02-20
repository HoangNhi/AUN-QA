import { useMemo, useState, useEffect } from "react";
import { useStandard } from "@/features/catalog/hooks/useStandard";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupStandard from "./PopupStandard";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { ACTIVE_STATUS_OPTIONS } from "@/constants/catalog.constants";
import { useQuery } from "@tanstack/react-query";
import { standardSetService } from "@/features/catalog/api/standardset.api";

const StandardPage = () => {
  const {
    data,
    standard,
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
  } = useStandard();

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [showPopupDetail, deleteList],
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch StandardSet options for filter
  const { data: standardSetResponse } = useQuery({
    queryKey: ["standardSets", "combobox"],
    queryFn: () => standardSetService.getAllCombobox(),
  });

  const standardSetOptions = standardSetResponse?.Data || [];

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
                StandardSetId: undefined,
              });
              setSearchTerm("");
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Combobox
            options={standardSetOptions}
            value={pageRequest.StandardSetId}
            onValueChange={(val) => {
              setPageRequest({
                ...pageRequest,
                StandardSetId: val || undefined,
                PageIndex: 1,
              });
            }}
            placeholder="Tất cả bộ tiêu chuẩn"
            searchPlaceholder="Tìm kiếm bộ tiêu chuẩn..."
            emptyText="Không tìm thấy bộ tiêu chuẩn."
          />
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
          <InputGroup className="col-span-1 md:col-span-2 bg-background">
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
        <PopupStandard
          key={standard?.Id || "new"}
          standard={standard}
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

export default StandardPage;
