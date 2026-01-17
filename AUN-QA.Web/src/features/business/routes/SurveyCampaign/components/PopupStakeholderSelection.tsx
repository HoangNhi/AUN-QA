import { useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { RowSelectionState } from "@tanstack/react-table";
import { stakeholderApi } from "@/features/catalog/api/stakeholder.api";
import { getStakeholderColumns } from "./columns";
import { DataTable, type PageRequest } from "./data-table";
import { Loader2, SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/Button";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";

interface PopupStakeholderSelectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholderType: string;
  onSelect: (selected: StakeholderGetListPaging[]) => void;
  excludeIds?: string[];
}

export const PopupStakeholderSelection = ({
  open,
  onOpenChange,
  stakeholderType,
  onSelect,
  excludeIds = [],
}: PopupStakeholderSelectionProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pageRequest, setPageRequest] = useState<PageRequest>({
    PageIndex: 1,
    PageSize: 10,
  });
  const [textSearch, setTextSearch] = useState("");

  const {
    data: listResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "stakeholders",
      "picker",
      stakeholderType,
      pageRequest,
      textSearch,
    ],
    queryFn: () =>
      stakeholderApi.getList({
        ...pageRequest,
        Type: parseInt(stakeholderType),
        TextSearch: textSearch,
      }),
    enabled: !!stakeholderType && open,
    placeholderData: keepPreviousData,
  });

  const allData = useMemo(() => listResponse?.Data?.Data || [], [listResponse]);
  const totalRow = useMemo(
    () => listResponse?.Data?.TotalRow || 0,
    [listResponse],
  );

  const data = useMemo(() => {
    if (excludeIds.length === 0) return allData;
    return allData.filter((s) => !excludeIds.includes(s.Id));
  }, [allData, excludeIds]);

  const columns = useMemo(() => getStakeholderColumns(), []);

  const handleSave = () => {
    const selectedData = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => data[parseInt(key)])
      .filter((item) => item !== undefined);

    onSelect(selectedData);
    setRowSelection({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0 space-y-1">
          <DialogTitle>Danh sách người tham gia</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 bg-gray-50/50 relative">
          <div className="h-full overflow-y-auto px-6 py-4">
            <DataTable
              columns={columns}
              data={data}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              pageRequest={pageRequest}
              setPageRequest={setPageRequest}
              totalRow={totalRow}
              getList={() => refetch()}
              className="space-y-4"
              isLoading={isLoading || isFetching}
              searchTerm={textSearch}
              setSearchTerm={setTextSearch}
              emptyStateClassName="h-[50vh]"
            />
          </div>
        </div>

        <DialogFooter className="p-4 border-t shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              Chọn ({Object.keys(rowSelection).length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
