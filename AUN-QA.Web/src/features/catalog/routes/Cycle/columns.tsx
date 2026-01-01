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
import type { ModelCycleGetListPaging } from "@/features/catalog/types/cycle.types";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void,
  canUpdate: boolean = true,
  canDelete: boolean = true
): ColumnDef<ModelCycleGetListPaging>[] => [
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
    header: "Kế hoạch",
  },
  {
    accessorKey: "Year",
    header: "Năm",
  },
  {
    accessorKey: "StatusName",
    header: "Trạng thái",
  },
  {
    accessorKey: "StartDate",
    header: "Ngày bắt đầu",
    cell: ({ row }) => {
      const date = row.getValue("StartDate");
      if (!date) return "";
      return format(date as string, "dd/MM/yyyy");
    },
  },
  {
    accessorKey: "EndDate",
    header: "Ngày kết thúc",
    cell: ({ row }) => {
      const date = row.getValue("EndDate");
      if (!date) return "";
      return format(date as string, "dd/MM/yyyy");
    },
  },
  {
    id: "actions",
    meta: {
      className: "text-center",
    },
    cell: ({ row }) => {
      if (!canUpdate && !canDelete) return null;
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
            {canUpdate && (
              <DropdownMenuItem
                onClick={() => showPopupDetail(row.original.Id, true)}
              >
                Cập nhật
              </DropdownMenuItem>
            )}
            {canDelete && (
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
