import { type ColumnDef } from "@tanstack/react-table";
import type { StakeholderGetListPaging } from "@/features/catalog/types/stakeholder.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getStakeholderColumns = (
  selectedIds: string[],
  onToggle: (id: string, checked: boolean) => void,
  onToggleAll: (checked: boolean) => void,
  selectAllState: boolean | "indeterminate",
  alreadySelectedIds: string[] = [],
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
    cell: ({ row }) => {
      const isAlreadySelected = alreadySelectedIds.includes(row.original.Id);
      return (
        <Checkbox
          checked={isAlreadySelected || selectedIds.includes(row.original.Id)}
          onCheckedChange={(value) => onToggle(row.original.Id, !!value)}
          disabled={isAlreadySelected}
          aria-label="Select row"
          title={isAlreadySelected ? "Đã được chọn" : undefined}
        />
      );
    },
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
