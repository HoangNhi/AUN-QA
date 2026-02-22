import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEvidenceCycleMap } from "../../hooks/useEvidenceCycleMap";
import { getColumns } from "./columns";
import PopupEvidenceCycleMap from "./PopupEvidenceCycleMap";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/Button";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Combobox } from "@/components/ui/combobox";
import { cycleService } from "@/features/catalog/api/cycle.api";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { EVIDENCE_STATUS_OPTIONS } from "@/constants/business.constants";
import { Card, CardContent } from "@/components/ui/card";

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
    submitToApprove,
    approve,
    isFetching,
    isLoading,
    isApproving,
  } = useEvidenceCycleMap();

  const { data: fileTypesData } = useQuery({
    queryKey: ["fileTypesCombobox"],
    queryFn: () => fileTypeService.getAllCombobox(),
  });
  const fileTypeMap = useMemo<Record<string, string>>(() => {
    return Object.fromEntries(
      (fileTypesData?.Data ?? []).map((t) => [t.Value ?? "", t.Text ?? ""]),
    );
  }, [fileTypesData]);

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList, fileTypeMap),
    [showPopupDetail, deleteList, fileTypeMap],
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  useEffect(() => {
    // Only text search has been changed to manual trigger. Other filters are still auto.
  }, [setPageRequest]);

  const handleDelete = () => {
    const ids = data.Data.filter((_, idx) => rowSelection[idx]).map(
      (item) => item.Id,
    );
    deleteList(ids);
    setShowDeleteConfirm(false);
    setRowSelection({});
  };

  const handleSubmitToApprove = () => {
    const ids = data.Data.filter((_, idx) => rowSelection[idx]).map(
      (item) => item.Id,
    );
    submitToApprove(ids);
    setShowSubmitConfirm(false);
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
                  CycleId: undefined,
                  FileTypeId: undefined,
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
                  CycleId: val ? val : undefined,
                  PageIndex: 1,
                });
              }}
              placeholder="Tất cả chu kỳ"
              searchPlaceholder="Tìm kiếm chu kỳ..."
              emptyText="Không tìm thấy chu kỳ."
            />

            <Combobox
              fetchOptions={async () => {
                const res = await fileTypeService.getAllCombobox();
                return (res.Data || []).map((t) => ({
                  Value: t.Value ?? "",
                  Text: t.Text ?? "",
                }));
              }}
              value={pageRequest.FileTypeId}
              onValueChange={(val) => {
                setPageRequest({
                  ...pageRequest,
                  FileTypeId: val ? val : undefined,
                  PageIndex: 1,
                });
              }}
              placeholder="Tất cả loại tài liệu"
              searchPlaceholder="Tìm kiếm loại tài liệu..."
              emptyText="Không tìm thấy loại tài liệu."
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
                placeholder="Tên hoặc mã minh chứng..."
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
            variant="secondary"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={Object.keys(rowSelection).length === 0}
          >
            Gửi duyệt
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
        <PopupEvidenceCycleMap
          key={evidenceCycleMap?.Id || "new"}
          evidenceCycleMap={evidenceCycleMap}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
          onApprove={approve}
          isApproving={isApproving}
        />
      )}

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        itemCount={Object.keys(rowSelection).length}
      />

      <ConfirmDeleteDialog
        open={showSubmitConfirm}
        onOpenChange={setShowSubmitConfirm}
        onConfirm={handleSubmitToApprove}
        itemCount={Object.keys(rowSelection).length}
        title="Xác nhận gửi duyệt"
        description={`Bạn có chắc chắn muốn gửi ${Object.keys(rowSelection).length} mục đã chọn để duyệt không?`}
        confirmText="Gửi duyệt"
        confirmVariant="default"
      />
    </div>
  );
};

export default EvidenceCycleMapPage;
