import { type ColumnDef, type Row } from "@tanstack/react-table";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  SurveyCampaign,
  SurveyCampaignGetListPaging,
} from "../../types/survey-campaign.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void,
  canUpdate: boolean = true,
  canDelete: boolean = true,
): ColumnDef<SurveyCampaignGetListPaging>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "Cycle",
    header: "Khóa học",
  },
  {
    accessorKey: "Name",
    header: "Tên chiến dịch",
  },
  {
    accessorKey: "Stakeholder",
    header: "Loại đối tượng",
  },
  {
    accessorKey: "Status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.Status;
      const map: Record<number, string> = {
        1: "Chưa bắt đầu",
        2: "Đang diễn ra",
        3: "Đã kết thúc",
      };
      return (
        <span className="text-center">{map[status] || "Không xác định"}</span>
      );
    },
  },
  {
    id: "actions",
    meta: {
      className: "text-center",
    },
    cell: ({ row }) => (
      <ActionCell
        row={row}
        showPopupDetail={showPopupDetail}
        deleteList={deleteList}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    ),
  },
];

const ActionCell = ({
  row,
  showPopupDetail,
  deleteList,
  canUpdate,
  canDelete,
}: {
  row: Row<SurveyCampaign>;
  showPopupDetail: (id: string, isEdit: boolean) => void;
  deleteList: (ids: string[]) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!canUpdate && !canDelete) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Chức năng</DropdownMenuLabel>

          {canUpdate && (
            <DropdownMenuItem
              onClick={() => showPopupDetail(row.original.Id, true)}
            >
              Cập nhật
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => showPopupDetail(row.original.Id, true)}
          >
            Người tham gia
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => showPopupDetail(row.original.Id, true)}
          >
            Chuyển trạng thái
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}>
                Xóa
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa bản ghi này không? Hành động này không
              thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                deleteList([row.original.Id]);
                setShowDeleteConfirm(false);
              }}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
