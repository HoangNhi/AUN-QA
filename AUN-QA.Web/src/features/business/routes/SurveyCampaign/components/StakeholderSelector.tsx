import { useState, useMemo, useCallback } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { Button } from "@/components/ui/Button";
import { getSessionColumns } from "./session-columns";
import { PopupStakeholderSelection } from "./PopupStakeholderSelection";
import type { SurveySession } from "../../../types/survey-campaign.types";
import { DataTable } from "@/components/ui/data-table";
import type { GetListPagingRequest } from "@/types/base/base.types";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StakeholderSelectorProps {
  stakeholderType: string;
  selectedSessions: SurveySession[];
  onSelectionChange: (
    selectedSessions: SurveySession[],
    selectionMeta?: { isResultAll: boolean; excludedIds: string[] },
  ) => void;
  isEdit: boolean;
  selectionMeta?: { isResultAll: boolean; excludedIds: string[] };
}

export const StakeholderSelector = ({
  stakeholderType,
  selectedSessions,
  onSelectionChange,
  isEdit,
  selectionMeta,
}: StakeholderSelectorProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: "",
  });

  const paginatedData = useMemo(() => {
    const startIndex = (pageRequest.PageIndex - 1) * pageRequest.PageSize;
    const endIndex = startIndex + pageRequest.PageSize;
    return selectedSessions.slice(startIndex, endIndex);
  }, [selectedSessions, pageRequest.PageIndex, pageRequest.PageSize]);

  // DELETE handler for single row (Action Column)
  const handleDeleteRow = useCallback(
    (session: SurveySession) => {
      const newSessions = selectedSessions.filter(
        (s) => s.StakeholderId !== session.StakeholderId,
      );
      onSelectionChange(newSessions, { isResultAll: false, excludedIds: [] });
      setRowSelection({});
    },
    [selectedSessions, onSelectionChange],
  );

  // Columns for the selected list
  const columns = useMemo(
    () => getSessionColumns(isEdit, handleDeleteRow),
    [isEdit, handleDeleteRow],
  );

  // DELETE handler
  const handleDelete = () => {
    // If in "Select All" mode, we can't delete individual rows easily from a list that doesn't exist.
    // So "Delete" button should probably reset the "Select All" mode or handle exclusions?
    // For now, let's assume we are just removing from the "Manual" list.
    if (selectionMeta?.isResultAll) {
      // logic for "Select All" deletion is complex, maybe just clear all?
      // user probably wants to Unselect specific items.
      // But here we are selecting from the TABLE.
      // So we are removing items from the VIEW.
      // Actually, if we are in "All Mode", we shouldn't show the table at all, so this handler isn't called for row selection.
      onSelectionChange([], { isResultAll: false, excludedIds: [] });
    } else {
      const newSessions = selectedSessions.filter(
        (s) => !rowSelection[s.StakeholderId],
      );
      onSelectionChange(newSessions, { isResultAll: false, excludedIds: [] });
      setRowSelection({});
    }
  };

  // ADD handler (from popup)
  const handleAdd = (
    result:
      | StakeholderGetListPaging[]
      | { type: "all"; excludedIds: string[] }
      | { items: StakeholderGetListPaging[] },
  ) => {
    if ("type" in result && result.type === "all") {
      // Replaces current selection with "All"
      onSelectionChange([], {
        isResultAll: true,
        excludedIds: result.excludedIds,
      });
    } else {
      // Manual selection: Append to existing if manual, or replace if we switched from "All"?
      // Usually "Add" implies appending. But if we were in "All" mode, adding more doesn't make sense.
      // So if we were in "All" mode, we switch back to Manual and just take the new ones?
      // Or we Append?
      // Let's Append for now, assuming user knows what they are doing.

      const items = Array.isArray(result)
        ? result
        : (result as { items: StakeholderGetListPaging[] }).items;
      if (!items) return;

      const newSessions = items.map(
        (stakeholder: StakeholderGetListPaging) =>
          ({
            Id: "",
            CampaignId: "",
            StakeholderId: stakeholder.Id,
            StakeholderName: stakeholder.FullName,
            StakeholderEmail: stakeholder.Email,
            Status: 1,
          }) as SurveySession,
      );

      // If we were in "All" mode before, we probably shouldn't be appending.
      // But let's assume switching to manual resets the "All" state.
      if (selectionMeta?.isResultAll) {
        onSelectionChange(newSessions, { isResultAll: false, excludedIds: [] });
      } else {
        onSelectionChange([...selectedSessions, ...newSessions], {
          isResultAll: false,
          excludedIds: [],
        });
      }
    }
  };

  if (!stakeholderType) {
    return (
      <div className="flex items-center justify-center h-48 border rounded-lg bg-gray-50 text-gray-500">
        Vui lòng chọn Loại đối tượng ở tab Thông tin chung trước.
      </div>
    );
  }

  const hasSelection = Object.keys(rowSelection).some(
    (key) => rowSelection[key],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button type="button" size="sm" onClick={() => setIsPopupOpen(true)}>
          Thêm
        </Button>

        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={!hasSelection}
        >
          Xóa
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        <DataTable
          columns={columns}
          data={paginatedData}
          totalRow={selectedSessions.length}
          pageRequest={pageRequest}
          setPageRequest={setPageRequest}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          containerClassName="max-h-[300px]"
          getRowId={(row) => row.StakeholderId}
        />
      </div>

      <PopupStakeholderSelection
        open={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        stakeholderType={stakeholderType}
        onSelect={handleAdd}
        alreadySelectedIds={
          selectionMeta?.isResultAll
            ? selectionMeta.excludedIds
            : selectedSessions.map((s) => s.StakeholderId)
        }
      />

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa{" "}
              {
                Object.keys(rowSelection).filter((key) => rowSelection[key])
                  .length
              }{" "}
              bản ghi đã chọn không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                handleDelete();
                setShowDeleteConfirm(false);
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
