import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCw,
  SearchIcon,
} from "lucide-react";
import type { GetListPagingRequest } from "@/types/base/base.types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRow: number;
  showPopupDetail?: (id: string, isEdit: boolean) => void;
  deleteList?: (ids: string[]) => void;
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  pageRequest: GetListPagingRequest;
  setPageRequest?: (pageRequest: GetListPagingRequest) => void;
  getList?: (pageRequest: GetListPagingRequest) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalRow,
  showPopupDetail,
  deleteList,
  rowSelection,
  setRowSelection,
  pageRequest,
  setPageRequest,
  getList,
}: DataTableProps<TData, TValue>) {
  const [searchTerm, setSearchTerm] = useState(pageRequest.TextSearch);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm !== pageRequest.TextSearch) {
      setPageRequest?.({
        ...pageRequest,
        TextSearch: debouncedSearchTerm,
        PageIndex: 1,
      });
    }
  }, [debouncedSearchTerm, pageRequest, setPageRequest]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 flex items-center gap-2">
          <Button size="sm" onClick={() => showPopupDetail?.("", false)}>
            Thêm
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() =>
              deleteList?.(
                table
                  .getSelectedRowModel()
                  .rows.map((row) => (row.original as any).Id)
              )
            }
          >
            Xóa
          </Button>
        </div>
        <InputGroup className="col-span-1">
          <InputGroupInput
            placeholder="Tìm kiếm..."
            value={searchTerm || ""}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="overflow-hidden rounded-md border">
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
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.className}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-96 text-center"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className=" flex-1 text-sm flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPageRequest?.({
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
            {Math.ceil(totalRow / pageRequest.PageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPageRequest?.({
                ...pageRequest,
                PageIndex: pageRequest.PageIndex + 1,
              })
            }
            disabled={
              pageRequest.PageIndex ===
              Math.ceil(totalRow / pageRequest.PageSize)
            }
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-x-2 text-muted-foreground">
          <span>
            {data.length < pageRequest.PageSize
              ? pageRequest.PageIndex * pageRequest.PageSize -
                pageRequest.PageSize +
                1 +
                " - " +
                (pageRequest.PageIndex * pageRequest.PageSize -
                  pageRequest.PageSize +
                  data.length) +
                " "
              : pageRequest.PageIndex * pageRequest.PageSize -
                pageRequest.PageSize +
                1 +
                " - " +
                pageRequest.PageIndex * pageRequest.PageSize +
                " "}
            trong {totalRow} mục
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => getList?.(pageRequest)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
