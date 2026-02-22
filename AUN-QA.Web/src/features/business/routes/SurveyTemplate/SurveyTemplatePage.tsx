import { useMemo, useState, useEffect } from "react";
import { useSurveyTemplate } from "../../hooks/useSurveyTemplate";
import { getColumns } from "./columns";
import PopupSurveyTemplate from "./PopupSurveyTemplate";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { SearchIcon } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

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
      <Card className="mb-4 bg-muted/40 shadow-none border-none sm:border-solid p-0">
        <CardContent className="p-4">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPageRequest?.({
                      ...pageRequest,
                      TextSearch: searchTerm,
                      PageIndex: 1,
                    });
                  }
                }}
              />
              <InputGroupButton
                onClick={() => {
                  setPageRequest?.({
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

      {/* Action Buttons */}
      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 flex items-center gap-2">
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
        onRefresh={() => getList?.()}
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
      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        itemCount={selectedRowIds.length}
      />
    </div>
  );
};

export default SurveyTemplatePage;
