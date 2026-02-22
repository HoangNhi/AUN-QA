import { useMemo, useState, useEffect } from "react";
import { useEvidence } from "@/features/business/hooks/useEvidence";
import { getColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import PopupEvidence from "./PopupEvidence";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { Combobox } from "@/components/ui/combobox";
import { fileTypeService } from "@/features/catalog/api/filetype.api";
import { EVIDENCE_STATUS_OPTIONS } from "@/constants/business.constants";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EvidencePage = () => {
  const {
    data,
    evidence,
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
    onApprove,
    isLoading,
    isSubmitting,
    isApproving,
    isFetching,
  } = useEvidence();

  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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

  const selectedIds = data.Data.filter((_, idx) => rowSelection[idx]).map(
    (item) => item.Id,
  );

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [showPopupDetail, deleteList],
  );

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
                setPageRequest((prev) => ({
                  ...prev,
                  PageIndex: 1,
                  TextSearch: "",
                  FileTypeId: undefined,
                  Status: undefined,
                }));
                setSearchTerm("");
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                setPageRequest((prev) => ({
                  ...prev,
                  FileTypeId: val ? val : undefined,
                  PageIndex: 1,
                }));
              }}
              placeholder="Tất cả loại tài liệu"
              searchPlaceholder="Tìm kiếm loại tài liệu..."
              emptyText="Không tìm thấy loại tài liệu."
            />

            <Combobox
              options={EVIDENCE_STATUS_OPTIONS}
              value={pageRequest.Status?.toString()}
              onValueChange={(val) => {
                setPageRequest((prev) => ({
                  ...prev,
                  Status: val ? Number(val) : undefined,
                  PageIndex: 1,
                }));
              }}
              placeholder="Tất cả trạng thái"
              searchPlaceholder="Tìm kiếm trạng thái..."
              emptyText="Không tìm thấy trạng thái."
            />

            <InputGroup className="col-span-1 bg-background md:col-span-2">
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
            variant="secondary"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={selectedIds.length === 0 || isSubmitting}
          >
            Gửi duyệt
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={selectedIds.length === 0}
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
        <PopupEvidence
          key={evidence?.Id || "new"}
          evidence={evidence}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
          onApprove={onApprove}
          isApproving={isApproving}
        />
      )}

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => {
          deleteList(selectedIds);
          setRowSelection({});
        }}
        itemCount={selectedIds.length}
        isLoading={isLoading}
      />

      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gửi duyệt</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gửi duyệt {selectedIds.length} mục đã chọn
              không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              variant="secondary"
              disabled={isSubmitting}
              onClick={async () => {
                await submitToApprove(selectedIds);
                setShowSubmitConfirm(false);
                setRowSelection({});
              }}
            >
              Gửi duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EvidencePage;
