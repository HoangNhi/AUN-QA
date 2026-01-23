import { type ColumnDef } from "@tanstack/react-table";
import type { SurveySession } from "../../../types/survey-campaign.types";

export const getViewStakeholderColumns = (): ColumnDef<SurveySession>[] => [
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
];
