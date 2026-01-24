import { type ColumnDef } from "@tanstack/react-table";
import type { SurveySession } from "../../../types/survey-campaign.types";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/Button";
import { MoreHorizontal, TrashIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const getViewStakeholderColumns = (
  onDelete?: (item: SurveySession) => void,
): ColumnDef<SurveySession>[] => [
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
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "StakeholderName",
    header: "Họ và tên",
  },
  {
    accessorKey: "StakeholderEmail",
    header: "Email",
  },
  {
    accessorKey: "Status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.Status;
      const statusMap: Record<number, { label: string; className: string }> = {
        1: { label: "Chưa gửi", className: "text-gray-500" },
        2: { label: "Đã gửi", className: "text-blue-600" },
        3: { label: "Đã hoàn thành", className: "text-green-600" },
      };

      const statusInfo = statusMap[status] || {
        label: "Không xác định",
        className: "text-gray-400",
      };

      return <span className={statusInfo.className}>{statusInfo.label}</span>;
    },
  },
  {
    id: "actions",
    header: "Thao tác",
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

            <DropdownMenuItem onClick={() => {}}>Gửi khảo sát</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(row.original)}>
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
