import { useState, useMemo, useCallback } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { Button } from "@/components/ui/Button";
import { getSessionColumns } from "./session-columns";
import { PopupStakeholderSelection } from "./PopupStakeholderSelection";
import type { SurveySession } from "../../../types/survey-campaign.types";
import { DataTable } from "@/components/ui/data-table";
import type { GetListPagingRequest } from "@/types/base/base.types";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";
import { stakeholderApi } from "@/features/catalog/api/stakeholder.api";
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
  const handleAdd = async (
    result:
      | StakeholderGetListPaging[]
      | { type: "all"; excludedIds: string[] }
      | { items: StakeholderGetListPaging[] },
  ) => {
    // Create a map of existing sessions by StakeholderId for quick lookup
    const existingSessionsMap = new Map(
      selectedSessions.map((s) => [s.StakeholderId, s]),
    );

    if ("type" in result && result.type === "all") {
      // Fetch ALL stakeholders from API
      try {
        const response = await stakeholderApi.getList({
          PageIndex: 1,
          PageSize: 10000, // Large number to get all
          Type: parseInt(stakeholderType),
          TextSearch: null,
        });

        const allStakeholders = response?.Data?.Data || [];

        // Filter out excluded IDs
        const filteredStakeholders = allStakeholders.filter(
          (s) => !result.excludedIds.includes(s.Id),
        );

        // Convert to SurveySession format, preserving existing session IDs
        const newSessions = filteredStakeholders.map((stakeholder) => {
          const existingSession = existingSessionsMap.get(stakeholder.Id);
          if (existingSession) {
            // Preserve existing session data (Id, Status, etc.)
            return {
              ...existingSession,
              StakeholderName: stakeholder.FullName,
              StakeholderEmail: stakeholder.Email,
            } as SurveySession;
          }
          // New stakeholder - create new session
          return {
            Id: "",
            CampaignId: "",
            StakeholderId: stakeholder.Id,
            StakeholderName: stakeholder.FullName,
            StakeholderEmail: stakeholder.Email,
            Status: 1,
          } as SurveySession;
        });

        onSelectionChange(newSessions, { isResultAll: false, excludedIds: [] });
      } catch (error) {
        console.error("Failed to fetch all stakeholders:", error);
      }
    } else {
      // Manual selection: Append to existing
      const items = Array.isArray(result)
        ? result
        : (result as { items: StakeholderGetListPaging[] }).items;
      if (!items) return;

      const newSessions = items.map((stakeholder: StakeholderGetListPaging) => {
        const existingSession = existingSessionsMap.get(stakeholder.Id);
        if (existingSession) {
          // Preserve existing session data (Id, Status, etc.)
          return {
            ...existingSession,
            StakeholderName: stakeholder.FullName,
            StakeholderEmail: stakeholder.Email,
          } as SurveySession;
        }
        // New stakeholder - create new session
        return {
          Id: "",
          CampaignId: "",
          StakeholderId: stakeholder.Id,
          StakeholderName: stakeholder.FullName,
          StakeholderEmail: stakeholder.Email,
          Status: 1,
        } as SurveySession;
      });

      // If we were in "All" mode before, replace with new selection
      if (selectionMeta?.isResultAll) {
        onSelectionChange(newSessions, { isResultAll: false, excludedIds: [] });
      } else {
        // Append new sessions, but avoid duplicates
        const existingIds = new Set(
          selectedSessions.map((s) => s.StakeholderId),
        );
        const uniqueNewSessions = newSessions.filter(
          (s) => !existingIds.has(s.StakeholderId),
        );
        onSelectionChange([...selectedSessions, ...uniqueNewSessions], {
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
