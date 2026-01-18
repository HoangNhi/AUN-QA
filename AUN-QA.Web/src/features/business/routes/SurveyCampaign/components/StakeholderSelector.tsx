import { useState, useMemo, useCallback } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { Button } from "@/components/ui/Button";
import { getSessionColumns } from "./session-columns";
import { PopupStakeholderSelection } from "./PopupStakeholderSelection";
import type { SurveySession } from "../../../types/survey-campaign.types";
import { DataTable } from "@/components/ui/data-table";
import type { GetListPagingRequest } from "@/types/base/base.types";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";

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
        (_, index) => !rowSelection[parseInt(index.toString())],
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
          onClick={handleDelete}
          disabled={!hasSelection}
        >
          Xóa
        </Button>
      </div>

      <div className="rounded-md border bg-white">
        {selectionMeta?.isResultAll ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3 bg-blue-50/50">
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="18" x2="23" y1="8" y2="13" />
                <line x1="23" x2="18" y1="8" y2="13" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Đã chọn tất cả đối tượng
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Hệ thống sẽ gửi khảo sát đến tất cả người dùng thuộc nhóm này
                {selectionMeta.excludedIds.length > 0 &&
                  ` (trừ ${selectionMeta.excludedIds.length} người bị loại trừ)`}
                .
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                onSelectionChange([], { isResultAll: false, excludedIds: [] })
              }
            >
              Hủy chọn tất cả
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedData}
            totalRow={selectedSessions.length}
            pageRequest={pageRequest}
            setPageRequest={setPageRequest}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            containerClassName="max-h-[300px] overflow-y-auto"
            getRowId={(row) => row.StakeholderId}
          />
        )}
      </div>

      <PopupStakeholderSelection
        open={isPopupOpen}
        onOpenChange={setIsPopupOpen}
        stakeholderType={stakeholderType}
        onSelect={handleAdd}
        excludeIds={
          selectionMeta?.isResultAll
            ? selectionMeta.excludedIds
            : selectedSessions.map((s) => s.StakeholderId)
        }
      />
    </div>
  );
};
