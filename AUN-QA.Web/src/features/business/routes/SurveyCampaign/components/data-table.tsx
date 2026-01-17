import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type OnChangeFn,
  type RowSelectionState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeftIcon,
  RotateCw,
  ChevronRightIcon,
  SearchIcon,
  Loader2,
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

export interface PageRequest {
  PageIndex: number;
  PageSize: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  pageRequest?: PageRequest;
  setPageRequest?: (request: any) => void;
  totalRow?: number;
  getList?: (request: any) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  hideToolbar?: boolean;
  className?: string;
  isLoading?: boolean;
  emptyStateClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
  pageRequest,
  setPageRequest,
  totalRow = 0,
  getList,
  searchTerm,
  setSearchTerm,
  className,
  isLoading,
  emptyStateClassName,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: !!pageRequest, // Use manual pagination if pageRequest is provided
  });

  return (
    <div className={className}>
      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 flex items-center gap-2"></div>
        <InputGroup className="col-span-1">
          <InputGroupInput
            placeholder="Tìm kiếm..."
            value={searchTerm || ""}
            onChange={(e) => setSearchTerm?.(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon className="h-4 w-4" />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="rounded-md border bg-white relative">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={`h-16 text-center ${emptyStateClassName || ""}`}
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className={`h-16 text-center ${emptyStateClassName || ""}`}
                >
                  Không có dữ liệu.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageRequest && setPageRequest ? (
        <div className="flex items-center justify-end space-x-2">
          <div className=" flex-1 text-sm flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPageRequest({
                  ...pageRequest,
                  PageIndex: pageRequest.PageIndex - 1,
                })
              }
              disabled={pageRequest.PageIndex === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span>
              Trang {pageRequest.PageIndex} /{" "}
              {Math.ceil(totalRow / pageRequest.PageSize) || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPageRequest({
                  ...pageRequest,
                  PageIndex: pageRequest.PageIndex + 1,
                })
              }
              disabled={
                pageRequest.PageIndex ===
                (Math.ceil(totalRow / pageRequest.PageSize) || 1)
              }
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-x-2 text-muted-foreground flex items-center">
            <span>
              {data.length > 0
                ? `${
                    (pageRequest.PageIndex - 1) * pageRequest.PageSize + 1
                  } - ${Math.min(
                    pageRequest.PageIndex * pageRequest.PageSize,
                    totalRow,
                  )}`
                : "0 - 0"}{" "}
              trong {totalRow} mục
            </span>
            {getList && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => getList(pageRequest)}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        // Client-side Pagination Controls (Tanstack Table Default)
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
