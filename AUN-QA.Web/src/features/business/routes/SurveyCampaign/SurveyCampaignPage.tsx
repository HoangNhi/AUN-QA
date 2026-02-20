import { useMemo, useState, useEffect } from "react";
import { useSurveyCampaign } from "../../hooks/useSurveyCampaign";
import { getColumns } from "./columns";
import PopupSurveyCampaign from "./PopupSurveyCampaign";
import { PopupSession } from "./components/PopupSession";
import { DataTable } from "@/components/ui/data-table";
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
import { STAKEHOLDER_TYPES } from "@/constants/catalog.constants";

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
    handleChangeStatus,
    isFetching,
    isLoading,
  } = useSurveyCampaign();

  const [isPopupSessionOpen, setIsPopupSessionOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const showPopupSession = (id: string, name: string) => {
    setSelectedCampaign({ id, name });
    setIsPopupSessionOpen(true);
  };

  const columns = useMemo(
    () =>
      getColumns(
        showPopupDetail,
        deleteList,
        showPopupSession,
        handleChangeStatus,
      ),
    [showPopupDetail, deleteList, showPopupSession, handleChangeStatus],
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
        <PopupSurveyCampaign
          key={surveyCampaign?.Id || "new"}
          surveyCampaign={surveyCampaign}
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

      <PopupSession
        open={isPopupSessionOpen}
        onOpenChange={setIsPopupSessionOpen}
        campaignId={selectedCampaign?.id || ""}
        campaignName={selectedCampaign?.name}
      />
    </div>
  );
};

export default SurveyCampaignPage;
