import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
  type OnChangeFn,
  type ColumnDef,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/Button";
import { Loader2, Plus, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import type { FileType } from "@/features/catalog/types/filetype.types";
import type { GetListPagingRequest } from "@/types/base/base.types";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRow: number;
  showPopupDetail: (id: string, isEdit: boolean) => void;
  deleteList: (ids: string[]) => void;
  rowSelection: RowSelectionState;
  setRowSelection: OnChangeFn<RowSelectionState>;
  pageRequest: GetListPagingRequest;
  setPageRequest: (request: GetListPagingRequest) => void;
  isFetching: boolean;
}

export function DataTable<TData extends FileType, TValue>({
  columns,
  data,
  totalRow,
  showPopupDetail,
  deleteList,
  rowSelection,
  setRowSelection,
  pageRequest,
  setPageRequest,
  isFetching,
}: DataTableProps<TData, TValue>) {
  const [searchTerm, setSearchTerm] = useState(pageRequest.TextSearch || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (debouncedSearchTerm !== pageRequest.TextSearch) {
      setPageRequest({
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
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
  });

  const selectedIds = Object.keys(rowSelection).map((index) => {
    const rowIndex = parseInt(index);
    return data[rowIndex]?.Id || "";
  });

  const pageCount = Math.ceil(totalRow / pageRequest.PageSize);
  const hasNextPage = pageRequest.PageIndex < pageCount;
  const hasPrevPage = pageRequest.PageIndex > 1;

  return (
    <div className="space-y-4 relative">
      {isFetching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={() => showPopupDetail("", false)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Thêm mới
        </Button>
        {selectedIds.length > 0 && (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            size="sm"
          >
            Xóa ({selectedIds.length})
          </Button>
        )}
        <InputGroup className="flex-1">
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

      <div className="rounded-md border overflow-hidden">
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                  className="h-24 text-center"
                >
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPageRequest({
              ...pageRequest,
              PageIndex: pageRequest.PageIndex - 1,
            })
          }
          disabled={!hasPrevPage}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Trang {pageRequest.PageIndex} / {pageCount}
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
          disabled={!hasNextPage}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedIds.length} loại tệp? Hành động này không
              thể được hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => {
                deleteList(selectedIds);
                setShowDeleteConfirm(false);
              }}
              variant="destructive"
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
