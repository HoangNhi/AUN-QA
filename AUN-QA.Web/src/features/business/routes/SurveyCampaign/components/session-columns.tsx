import { type ColumnDef } from "@tanstack/react-table";
import type { SurveySession } from "../../../types/survey-campaign.types";
import { Checkbox } from "@/components/ui/checkbox";

export const getSessionColumns = (): ColumnDef<SurveySession>[] => [
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
    accessorKey: "StakeholderName",
    header: "Họ và tên",
  },
  {
    accessorKey: "StakeholderEmail",
    header: "Email",
  },
];
