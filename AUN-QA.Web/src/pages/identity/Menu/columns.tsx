import { type ColumnDef } from "@tanstack/react-table";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Menu } from "@/types/identity/menu.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getColumns = (
  showPopupDetail: (id: string, isEdit: boolean) => void,
  deleteList: (ids: string[]) => void
): ColumnDef<Menu>[] => [
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
    accessorKey: "SystemGroup",
    header: "Nhóm quyền",
  },
  {
    accessorKey: "Controller",
    header: "Controller",
  },
  {
    accessorKey: "CanView",
    header: "Xem",
    className: "text-center",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.original.CanView}
          onCheckedChange={(value) => (row.original.CanView = !!value)}
        />
      );
    },
  },
  {
    accessorKey: "CanAdd",
    header: "Thêm",
    className: "text-center",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.original.CanAdd}
          onCheckedChange={(value) => (row.original.CanAdd = !!value)}
        />
      );
    },
  },
  {
    accessorKey: "CanUpdate",
    header: "Cập nhật",
    className: "text-center",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.original.CanUpdate}
          onCheckedChange={(value) => (row.original.CanUpdate = !!value)}
        />
      );
    },
  },
  {
    accessorKey: "CanDelete",
    header: "Xóa",
    className: "text-center",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.original.CanDelete}
          onCheckedChange={(value) => (row.original.CanDelete = !!value)}
        />
      );
    },
  },
  {
    accessorKey: "CanApprove",
    header: "Duyệt",
    className: "text-center",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.original.CanApprove}
          onCheckedChange={(value) => (row.original.CanApprove = !!value)}
        />
      );
    },
  },
  {
    accessorKey: "CanAnalyze",
    header: "Thống kê",
    className: "text-center",
    cell: ({ row }) => {
      return (
        <Checkbox
          checked={row.original.CanAnalyze}
          onCheckedChange={(value) => (row.original.CanAnalyze = !!value)}
        />
      );
    },
  },
  {
    id: "actions",
    className: "text-center",
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
            <DropdownMenuItem
              onClick={() => showPopupDetail(row.original.Id, true)}
            >
              Cập nhật
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteList([row.original.Id])}>
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
