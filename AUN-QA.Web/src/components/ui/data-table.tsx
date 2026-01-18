import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
  type OnChangeFn,
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
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Loader2,
} from "lucide-react";
import type { GetListPagingRequest } from "@/types/base/base.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRow?: number;
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  pageRequest?: GetListPagingRequest;
  setPageRequest?: (pageRequest: GetListPagingRequest) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
  containerClassName?: string;
  getRowId?: (row: TData, index: number) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalRow,
  rowSelection,
  setRowSelection,
  pageRequest,
  setPageRequest,
  onRefresh,
  isLoading = false,
  className,
  containerClassName,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    getRowId,
    state: {
      rowSelection,
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative overflow-hidden rounded-md border">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <Table containerClassName={containerClassName}>
          <TableHeader className="bg-background sticky top-0 z-10">
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
            {table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          (cell.column.columnDef.meta as { className?: string })
                            ?.className
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {pageRequest &&
                  table.getRowModel().rows.length < pageRequest.PageSize && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="p-0"
                        style={{
                          height: `${
                            (pageRequest.PageSize -
                              table.getRowModel().rows.length) *
                            3.5 // Estimating 3.5rem (56px) per row
                          }rem`,
                        }}
                      ></TableCell>
                    </TableRow>
                  )}
              </>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageRequest && totalRow !== undefined && (
        <DataTablePagination
          pageRequest={pageRequest}
          setPageRequest={setPageRequest}
          totalRow={totalRow}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

interface DataTablePaginationProps {
  pageRequest: GetListPagingRequest;
  setPageRequest?: (pageRequest: GetListPagingRequest) => void;
  totalRow: number;
  onRefresh?: () => void;
}

function DataTablePagination({
  pageRequest,
  setPageRequest,
  totalRow,
  onRefresh,
}: DataTablePaginationProps) {
  const pageCount = Math.ceil(totalRow / pageRequest.PageSize) || 1;
  const pageSizeOptions = [10, 20, 30, 50, 100];

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {totalRow > 0 ? (
          <>
            Hiển thị{" "}
            <span className="font-medium">
              {(pageRequest.PageIndex - 1) * pageRequest.PageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium">
              {Math.min(pageRequest.PageIndex * pageRequest.PageSize, totalRow)}
            </span>{" "}
            trong <span className="font-medium">{totalRow}</span> mục
          </>
        ) : (
          "Không có dữ liệu"
        )}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Số dòng mỗi trang</p>
          <Select
            value={`${pageRequest.PageSize}`}
            onValueChange={(value) => {
              setPageRequest?.({
                ...pageRequest,
                PageSize: Number(value),
                PageIndex: 1, // Reset to first page
              });
            }}
          >
            <SelectTrigger className="h-8 w-fit">
              <SelectValue placeholder={pageRequest.PageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Trang {pageRequest.PageIndex} / {pageCount}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() =>
                setPageRequest?.({
                  ...pageRequest,
                  PageIndex: 1,
                })
              }
              disabled={pageRequest.PageIndex === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() =>
                setPageRequest?.({
                  ...pageRequest,
                  PageIndex: pageRequest.PageIndex - 1,
                })
              }
              disabled={pageRequest.PageIndex === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() =>
                setPageRequest?.({
                  ...pageRequest,
                  PageIndex: pageRequest.PageIndex + 1,
                })
              }
              disabled={pageRequest.PageIndex === pageCount}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() =>
                setPageRequest?.({
                  ...pageRequest,
                  PageIndex: pageCount,
                })
              }
              disabled={pageRequest.PageIndex === pageCount}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>

            {onRefresh && (
              <Button
                variant="outline"
                className="h-8 w-8 p-0 ml-2"
                onClick={onRefresh}
                title="Làm mới"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
