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
import type { Role } from "@/features/system/types/role.types";
import { Checkbox } from "@/components/ui/checkbox";

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);

  // Helper function to pad single digits with a leading zero
  const pad = (num: number) => String(num).padStart(2, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1); // Remember: Months are 0-indexed (Jan is 0)
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void,
  showPopupPermission: (id: string) => void,
  isUpdated?: boolean,
  isDeleted?: boolean
): ColumnDef<Role>[] => [
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
    accessorKey: "CreateAt",
    header: "Ngày tạo",
    cell: ({ row }) => formatDate(row.original.CreatedAt),
  },
  {
    accessorKey: "UpdatedAt",
    header: "Ngày cập nhật",
    cell: ({ row }) => formatDate(row.original.UpdatedAt),
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
              <span className="sr-only">Open menu</span>
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
            {isUpdated && (
              <DropdownMenuItem
                onClick={() => showPopupPermission(row.original.Id)}
              >
                Phân quyền
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
