import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/data-table";
import { getViewStakeholderColumns } from "./session-columns";
import type { GetListSessionRequest } from "../../../types/survey-campaign.types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon } from "lucide-react";
import { useSurveySession } from "../../../hooks/useSurveySession";
import { Combobox } from "@/components/ui/combobox";
import { SESSION_STATUS_OPTIONS } from "@/constants/business.constants";

interface PopupSessionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName?: string;
}

export const PopupSession = ({
  open,
  onOpenChange,
  campaignId,
  campaignName,
}: PopupSessionProps) => {
  const [pageRequest, setPageRequest] = useState<GetListSessionRequest>({
    PageIndex: 1,
    PageSize: 10,
    TextSearch: null,
    CampaignId: campaignId,
    Status: undefined,
  });
  const [textSearch, setTextSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, totalRow, isFetching, refetch } = useSurveySession(
    pageRequest,
    open,
  );

  const columns = useMemo(() => getViewStakeholderColumns(), []);

  const handleSearchChange = (value: string) => {
    setTextSearch(value);
    setPageRequest((prev) => ({
      ...prev,
      TextSearch: value || null,
      PageIndex: 1,
    }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPageRequest((prev) => ({
      ...prev,
      Status: value === "all" ? undefined : Number(value),
      PageIndex: 1,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0 space-y-1">
          <DialogTitle>
            Danh sách người tham gia
            {campaignName && (
              <span className="text-muted-foreground font-normal">
                {" "}
                - {campaignName}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 bg-gray-50/50 relative">
          <div className="h-full overflow-y-auto px-6 py-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Combobox
                  options={SESSION_STATUS_OPTIONS}
                  value={pageRequest.Status?.toString()}
                  onValueChange={(val) => {
                    setPageRequest({
                      ...pageRequest,
                      Status: val ? Number(val) : undefined,
                      PageIndex: 1,
                    });
                  }}
                  placeholder="Tất cả trạng thái"
                  searchPlaceholder="Tìm kiếm trạng thái..."
                  emptyText="Không tìm thấy trạng thái."
                />

                <InputGroup className="col-span-1 bg-white">
                  <InputGroupInput
                    placeholder="Tìm kiếm..."
                    value={textSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                pageRequest={pageRequest}
                setPageRequest={setPageRequest}
                isLoading={isFetching}
                onRefresh={refetch}
                containerClassName="max-h-[320px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t shrink-0 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
