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
import type { SurveyCampaignGetListPaging } from "../../types/survey-campaign.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void,
  showPopupSession: (id: string, name: string) => void,
  changeStatus: (id: string) => void,
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
        showPopupSession={showPopupSession}
        changeStatus={changeStatus}
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
  showPopupSession,
  changeStatus,
  canUpdate,
  canDelete,
}: {
  row: Row<SurveyCampaignGetListPaging>;
  showPopupDetail: (id: string, isEdit: boolean) => void;
  deleteList: (ids: string[]) => void;
  showPopupSession: (id: string, name: string) => void;
  changeStatus: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  if (!canUpdate && !canDelete) return null;

  const status = row.original.Status;
  const isDraft = status === 1;
  const isSent = status === 2;
  const isCompleted = status === 3;

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
            onClick={() => showPopupSession(row.original.Id, row.original.Name)}
          >
            Người tham gia
          </DropdownMenuItem>

          {!isCompleted && canUpdate && (
            <DropdownMenuItem onClick={() => setShowStatusConfirm(true)}>
              {isDraft ? "Gửi khảo sát" : "Kết thúc khảo sát"}
            </DropdownMenuItem>
          )}

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

      <Dialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription>
              {isDraft
                ? "Bạn có chắc chắn muốn phát hành khảo sát này? Email mời tham gia sẽ được gửi đến tất cả người tham gia trong danh sách."
                : "Bạn có chắc chắn muốn kết thúc khảo sát này? Người tham gia sẽ không thể truy cập khảo sát nữa."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              onClick={() => {
                changeStatus(row.original.Id);
                setShowStatusConfirm(false);
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
