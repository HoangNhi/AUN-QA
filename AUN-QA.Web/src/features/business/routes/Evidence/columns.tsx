import { type ColumnDef, type Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useState } from "react";
import type { EvidenceGetListPaging } from "@/features/business/types/evidence.types";
import { Checkbox } from "@/components/ui/checkbox";
import { EVIDENCE_STATUS_OPTIONS } from "@/constants/business.constants";

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void,
): ColumnDef<EvidenceGetListPaging>[] => [
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
    accessorKey: "Code",
    header: "Mã MC",
  },
  {
    accessorKey: "Name",
    header: "Tên minh chứng",
  },
  {
    accessorKey: "Status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.getValue("Status") as number;
      const statusOption = EVIDENCE_STATUS_OPTIONS.find(
        (opt) => opt.Value === status.toString(),
      );
      const statusText = statusOption?.Text || "N/A";

      // Color coding based on status
      const statusColors: Record<number, string> = {
        1: "bg-gray-100 text-gray-700", // Dự thảo
        2: "bg-yellow-100 text-yellow-700", // Chờ duyệt
        3: "bg-green-100 text-green-700", // Đã duyệt
        4: "bg-red-100 text-red-700", // Từ chối
      };

      const colorClass = statusColors[status] || "bg-gray-100 text-gray-700";

      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
        >
          {statusText}
        </span>
      );
    },
  },
  {
    accessorKey: "FileTypeName",
    header: "Loại tài liệu",
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
      />
    ),
  },
];

const ActionCell = ({
  row,
  showPopupDetail,
  deleteList,
}: {
  row: Row<EvidenceGetListPaging>;
  showPopupDetail: (id: string, isEdit: boolean) => void;
  deleteList: (ids: string[]) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
          <DropdownMenuItem
            onClick={() => showPopupDetail(row.original.Id, true)}
          >
            Cập nhật
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)}>
            Xóa
          </DropdownMenuItem>
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

