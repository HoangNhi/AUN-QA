import { useState, useMemo, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { stakeholderApi } from "@/features/catalog/api/stakeholder.api";
import { getStakeholderColumns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import type { GetListPagingRequest } from "@/types/base/base.types";
import { SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const [selectedItems, setSelectedItems] = useState<
    Map<string, StakeholderGetListPaging>
  >(new Map());
  const [pageRequest, setPageRequest] = useState<GetListPagingRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: null,
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

  const selectedIds = useMemo(
    () => Array.from(selectedItems.keys()),
    [selectedItems],
  );

  const handleToggle = useCallback(
    (id: string, checked: boolean) => {
      setSelectedItems((prev) => {
        const next = new Map(prev);
        if (checked) {
          const item = data.find((d) => d.Id === id);
          if (item) next.set(id, item);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    [data],
  );

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      setSelectedItems((prev) => {
        const isPageFull = data.every((d) => prev.has(d.Id));
        const shouldSelect = checked && !isPageFull;
        const next = new Map(prev);
        if (shouldSelect) {
          data.forEach((d) => {
            if (!next.has(d.Id)) {
              next.set(d.Id, d);
            }
          });
        } else {
          data.forEach((d) => {
            next.delete(d.Id);
          });
        }
        return next;
      });
    },
    [data],
  );

  const isAllPageSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.every((d) => selectedItems.has(d.Id));
  }, [data, selectedItems]);

  const isSomePageSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.some((d) => selectedItems.has(d.Id));
  }, [data, selectedItems]);

  const selectAllState = useMemo(() => {
    if (isAllPageSelected) return true;
    if (isSomePageSelected) return "indeterminate";
    return false;
  }, [isAllPageSelected, isSomePageSelected]);

  const columns = useMemo(
    () =>
      getStakeholderColumns(
        selectedIds,
        handleToggle,
        handleToggleAll,
        selectAllState,
      ),
    [selectedIds, selectAllState, handleToggle, handleToggleAll], // Re-create columns when selection changes so checkboxes update
  );

  const handleSave = () => {
    onSelect(Array.from(selectedItems.values()));
    setSelectedItems(new Map());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0 space-y-1">
          <DialogTitle>Danh sách người tham gia</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 bg-gray-50/50 relative">
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 items-center justify-between">
                <div className="col-span-2 flex items-center gap-2"></div>
                <InputGroup className="col-span-1 bg-white">
                  <InputGroupInput
                    placeholder="Tìm kiếm..."
                    value={textSearch}
                    onChange={(e) => setTextSearch(e.target.value)}
                  />
                  <InputGroupAddon>
                    <SearchIcon className="h-4 w-4" />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <DataTable
                columns={columns}
                data={data}
                totalRow={totalRow}
                rowSelection={{}}
                pageRequest={pageRequest}
                setPageRequest={setPageRequest}
                onRefresh={refetch}
                isLoading={isLoading || isFetching}
                containerClassName="max-h-[300px] overflow-y-auto"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {`Chọn (${selectedItems.size})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
