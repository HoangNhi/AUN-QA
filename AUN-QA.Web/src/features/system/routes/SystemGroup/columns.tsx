import { type ColumnDef } from "@tanstack/react-table";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SystemGroupGetListPaging } from "@/features/system/types/systemGroup.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void,
  isUpdated?: boolean,
  isDeleted?: boolean
): ColumnDef<SystemGroupGetListPaging>[] => [
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
    accessorKey: "Name",
    header: "Tên gọi",
  },
  {
    accessorKey: "Parent",
    header: "Nhóm cha",
  },
  {
    accessorKey: "Sort",
    header: "Thứ tự",
  },
  {
    accessorKey: "IsActived",
    header: "Trạng thái",
    cell: ({ row }) =>
      row.original.IsActived ? "Hoạt động" : "Không hoạt động",
  },
  {
    id: "actions",
    meta: {
      className: "text-center",
    },
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Chức năng</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Chức năng</DropdownMenuLabel>
            {isUpdated && (
              <DropdownMenuItem
                onClick={() => showPopupDetail(row.original.Id, true)}
              >
                Cập nhật
              </DropdownMenuItem>
            )}
            {isDeleted && (
              <DropdownMenuItem onClick={() => deleteList([row.original.Id])}>
                Xóa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
