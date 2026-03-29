import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { SarGetListItem } from "@/features/business/types/sar.types";

const SAR_STATUS_META: Record<number, { label: string; className: string }> = {
  1: {
    label: "Nhập",
    className: "bg-slate-100 text-slate-600 border border-slate-300",
  },
  2: {
    label: "Đang xử lý",
    className: "bg-blue-100 text-blue-600 border border-blue-300",
  },
  3: {
    label: "Hoàn tất",
    className: "bg-green-100 text-green-600 border border-green-300",
  },
};

function getStatusMeta(status: number) {
  return (
    SAR_STATUS_META[status] ?? {
      label: "Không xác định",
      className: "bg-gray-100 text-gray-500 border border-gray-300",
    }
  );
}

export const getColumns = (
  openEditor: (item: SarGetListItem) => void,
): ColumnDef<SarGetListItem>[] => [
  {
    accessorKey: "CycleName",
    header: "Chu kỳ",
    cell: ({ row }) => (
      <button
        type="button"
        className="text-left text-primary hover:underline"
        onClick={() => openEditor(row.original)}
      >
        {row.original.CycleName}
      </button>
    ),
  },
  {
    accessorKey: "Year",
    header: () => <div className="text-center">Năm</div>,
    meta: {
      className: "text-center",
    },
  },
  {
    accessorKey: "Status",
    header: () => <div className="text-center">Trạng thái SAR</div>,
    meta: {
      className: "text-center",
    },
    cell: ({ row }) => {
      const meta = getStatusMeta(Number(row.original.Status));
      return (
        <div className="flex justify-center">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.className}`}
          >
            {meta.label}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "LastSavedAt",
    header: () => <div className="text-center">Lưu lần cuối</div>,
    meta: {
      className: "text-center",
    },
    cell: ({ row }) => {
      const value = row.original.LastSavedAt;
      if (!value) {
        return <div className="text-center text-muted-foreground">--</div>;
      }

      return (
        <div className="text-center">{format(new Date(value), "dd/MM/yyyy HH:mm")}</div>
      );
    },
  },
  {
    accessorKey: "UpdatedBy",
    header: "Người cập nhật",
    cell: ({ row }) => row.original.UpdatedBy || "--",
  },
  {
    id: "actions",
    header: () => <div className="text-center">Thao tác</div>,
    meta: {
      className: "text-center",
    },
    cell: ({ row }) => (
      <Button size="sm" onClick={() => openEditor(row.original)}>
        Mở
      </Button>
    ),
  },
];

