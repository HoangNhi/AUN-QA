import { useMemo, useState, useEffect } from "react";
import { useSurveyTemplate } from "../../hooks/useSurveyTemplate";
import { getColumns } from "./columns";
import PopupSurveyTemplate from "./PopupSurveyTemplate";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import {
  InputGroup,
  InputGroupAddon,
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
import { SearchIcon } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";

const SurveyTemplatePage = () => {
  const {
    data,
    surveyTemplate,
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
  } = useSurveyTemplate();

  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || "",
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync debounced search term with pageRequest
  useEffect(() => {
    if (debouncedSearchTerm !== pageRequest.TextSearch) {
      setPageRequest?.({
        ...pageRequest,
        TextSearch: debouncedSearchTerm,
        PageIndex: 1,
      });
    }
  }, [debouncedSearchTerm, pageRequest, setPageRequest]);

  const columns = useMemo(
    () => getColumns(showPopupDetail, deleteList),
    [showPopupDetail, deleteList],
  );

  // Get selected row IDs for delete
  const selectedRowIds = Object.keys(rowSelection || {}).filter(
    (key) => rowSelection?.[key],
  );

  const handleDelete = () => {
    if (selectedRowIds.length > 0) {
      deleteList?.(selectedRowIds);
      setShowDeleteConfirm(false);
      setRowSelection?.({});
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPageRequest?.({
      ...pageRequest,
      TextSearch: "",
      StakeholderType: undefined,
      PageIndex: 1,
    });
  };

  return (
    <div className="container mx-auto space-y-4">
      {/* Filter Section */}
      <div className="rounded-lg border bg-muted/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Lọc danh sách</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={handleResetFilters}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Combobox
            options={STAKEHOLDER_TYPES}
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
        <Button size="sm" onClick={() => showPopupDetail?.("", false)}>
          Thêm
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={selectedRowIds.length === 0}
        >
          Xóa
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data.Data}
        totalRow={data.TotalRow}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pageRequest={pageRequest}
        setPageRequest={setPageRequest}
        onRefresh={() => getList?.(pageRequest)}
        isLoading={isFetching}
      />

      {/* Popup Form */}
      {isOpen && (
        <PopupSurveyTemplate
          key={surveyTemplate?.Id || "new"}
          surveyTemplate={surveyTemplate}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          saveChange={saveChange}
          isLoading={isLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedRowIds.length} mục đã chọn
              không? Hành động này không thể hoàn tác.
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

export default SurveyTemplatePage;
