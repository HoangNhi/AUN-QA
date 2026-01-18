import { type ColumnDef } from "@tanstack/react-table";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getStakeholderColumns = (
  selectedIds: string[],
  onToggle: (id: string, checked: boolean) => void,
  onToggleAll: (checked: boolean) => void,
  selectAllState: boolean | "indeterminate",
): ColumnDef<StakeholderGetListPaging>[] => [
  {
    id: "select",
    header: () => (
      <Checkbox
        checked={selectAllState}
        onCheckedChange={(value) => onToggleAll(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedIds.includes(row.original.Id)}
        onCheckedChange={(value) => onToggle(row.original.Id, !!value)}
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
