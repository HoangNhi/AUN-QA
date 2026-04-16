import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { ActionPlanListItem } from "@/features/business/types/actionPlan.types";
import { getActionPlanStatusLabel } from "./actionPlan.utils";

function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return "Cao";
    case 2:
      return "Trung bình";
    case 3:
      return "Thấp";
    default:
      return "Không xác định";
  }
}

export function getActionPlanColumns(
  onEdit: (item: ActionPlanListItem) => void,
): ColumnDef<ActionPlanListItem>[] {
  return [
    {
      accessorKey: "Title",
      header: "Kế hoạch",
      cell: ({ row }) => (
        <div className="min-w-[240px]">
          <p className="font-medium text-slate-900">{row.original.Title}</p>
          {row.original.Description ? (
            <p className="line-clamp-2 text-xs text-slate-500">
              {row.original.Description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "CycleName",
      header: "Chu kỳ",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-700">{row.original.CycleName}</p>
          <p className="text-xs text-slate-500">Năm {row.original.Year}</p>
        </div>
      ),
    },
    {
      accessorKey: "Priority",
      header: "Ưu tiên",
      cell: ({ row }) => getPriorityLabel(Number(row.original.Priority)),
    },
    {
      accessorKey: "Deadline",
      header: "Hạn",
      cell: ({ row }) => new Date(row.original.Deadline).toLocaleDateString("vi-VN"),
    },
    {
      accessorKey: "AssigneeCount",
      header: () => <div className="text-center">Giao việc</div>,
      meta: { className: "text-center" },
      cell: ({ row }) => row.original.AssigneeCount,
    },
    {
      accessorKey: "DoneTaskCount",
      header: () => <div className="text-center">Tiến độ</div>,
      meta: { className: "text-center" },
      cell: ({ row }) => `${row.original.DoneTaskCount}/${row.original.TotalTaskCount}`,
    },
    {
      accessorKey: "Status",
      header: () => <div className="text-center">Trạng thái</div>,
      meta: { className: "text-center" },
      cell: ({ row }) => getActionPlanStatusLabel(Number(row.original.Status)),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Hành động</div>,
      meta: { className: "text-center" },
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button size="sm" variant="secondary" onClick={() => onEdit(row.original)}>
            Mở
          </Button>
        </div>
      ),
    },
  ];
}
