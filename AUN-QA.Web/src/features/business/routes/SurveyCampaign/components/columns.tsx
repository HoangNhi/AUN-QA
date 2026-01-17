import { type ColumnDef } from "@tanstack/react-table";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getStakeholderColumns =
  (): ColumnDef<StakeholderGetListPaging>[] => [
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
    },
    {
      accessorKey: "FullName",
      header: "Họ và tên",
    },
    {
      accessorKey: "Email",
      header: "Email",
    },
    {
      accessorKey: "Description",
      header: "Mô tả",
    },
  ];
