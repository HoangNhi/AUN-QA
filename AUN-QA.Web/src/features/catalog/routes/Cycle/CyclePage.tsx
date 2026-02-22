import { useMemo, useState, useEffect } from "react";
import { useCycle } from "@/features/catalog/hooks/useCycle";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupCycle from "./PopupCycle";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";

import { SearchIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  CYCLE_STATUS_OPTIONS,
  CYCLE_SCOPE_OPTIONS,
} from "@/constants/catalog.constants";
import { standardSetService } from "../../api/standardset.api";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const CyclePage = () => {
  const {
    data,
    cycle,
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
    changeStatus,
    isLoading,
    isFetching,
  } = useCycle();

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList, changeStatus),
    [showPopupDetail, deleteList, changeStatus],
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [yearTerm, setYearTerm] = useState<number>(pageRequest.Year || 0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setPageRequest((prev) => {
      const normalizedYear = yearTerm || undefined;
      if (
        prev.TextSearch === debouncedSearchTerm &&
        prev.Year === normalizedYear
      )
        return prev;
      return {
        ...prev,
        TextSearch: debouncedSearchTerm,
        Year: normalizedYear,
        PageIndex: 1,
      };
    });
  }, [debouncedSearchTerm, yearTerm, setPageRequest]);

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
                  Status: undefined,
                  Scope: undefined,
                  Year: undefined,
                });
                setSearchTerm("");
                setYearTerm(0);
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <Combobox
              options={CYCLE_STATUS_OPTIONS}
              value={pageRequest.Status}
              onValueChange={(val) => {
                setPageRequest({
                  ...pageRequest,
                  Status: val || undefined,
                  PageIndex: 1,
                });
              }}
              placeholder="Tất cả trạng thái"
              searchPlaceholder="Tìm kiếm trạng thái..."
              emptyText="Không tìm thấy trạng thái."
            />
            <Combobox
              fetchOptions={async () => {
                const res = await standardSetService.getAllCombobox();
                return (res.Data || []).map((t) => ({
                  Value: t.Value ?? "",
                  Text: t.Text ?? "",
                }));
              }}
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
              options={CYCLE_SCOPE_OPTIONS}
              value={pageRequest.Scope}
              onValueChange={(val) => {
                setPageRequest({
                  ...pageRequest,
                  Scope: val || undefined,
                  PageIndex: 1,
                });
              }}
              placeholder="Tất cả phạm vi"
              searchPlaceholder="Tìm kiếm phạm vi..."
              emptyText="Không tìm thấy phạm vi."
            />
            <Input
              type="number"
              placeholder="Năm"
              value={yearTerm || ""}
              onChange={(e) => setYearTerm(Number(e.target.value))}
              className="bg-background"
            />
            <InputGroup className="col-span-1 bg-background lg:col-span-1">
              <InputGroupInput
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
              />
              <InputGroupButton
                onClick={() => {
                  setPageRequest((prev) => ({
                    ...prev,
                    TextSearch: searchTerm,
                    PageIndex: 1,
                  }));
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
        <PopupCycle
          key={cycle?.Id || "new"}
          cycle={cycle}
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

export default CyclePage;
