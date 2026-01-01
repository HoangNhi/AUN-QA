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
import { Button } from "@/components/ui/Button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCw,
  SearchIcon,
} from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CycleGetListPagingRequest } from "../../types/cycle.types";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalRow: number;
  showPopupDetail?: (id: string, isEdit: boolean) => void;
  deleteList?: (ids: string[]) => void;
  rowSelection?: RowSelectionState;
  setRowSelection?: OnChangeFn<RowSelectionState>;
  pageRequest: CycleGetListPagingRequest;
  setPageRequest?: (pageRequest: CycleGetListPagingRequest) => void;
  getList?: (pageRequest: CycleGetListPagingRequest) => void;
  canAdd?: boolean;
  canDelete?: boolean;
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
  canAdd = true,
  canDelete = true,
}: DataTableProps<TData, TValue>) {
  const [searchTerm, setSearchTerm] = useState<string>(
    pageRequest.TextSearch || ""
  );
  const [scopeTerm, setScopeTerm] = useState<string>(pageRequest.Scope || "");
  const [statusTerm, setStatusTerm] = useState<string>(
    pageRequest.Status || ""
  );
  const [yearTerm, setYearTerm] = useState<number>(pageRequest.Year || 0);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const normalize = (value: string | number) =>
      value === "null" || value === 0 || value === "" ? undefined : value;

    const normalizedScope = normalize(scopeTerm) as string | undefined;
    const normalizedStatus = normalize(statusTerm) as string | undefined;
    const normalizedYear = normalize(yearTerm) as number | undefined;

    if (
      debouncedSearchTerm !== pageRequest.TextSearch ||
      normalizedScope !== pageRequest.Scope ||
      normalizedStatus !== pageRequest.Status ||
      normalizedYear !== pageRequest.Year
    ) {
      setPageRequest?.({
        ...pageRequest,
        TextSearch: debouncedSearchTerm,
        PageIndex: 1,
        Scope: normalizedScope,
        Status: normalizedStatus,
        Year: normalizedYear,
      });
    }
  }, [
    debouncedSearchTerm,
    pageRequest,
    setPageRequest,
    scopeTerm,
    statusTerm,
    yearTerm,
  ]);

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
      <div className="mb-4 rounded-lg border bg-muted/40 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Lọc danh sách</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => {
              setPageRequest?.({
                ...pageRequest,
                TextSearch: "",
                Scope: undefined,
                Status: undefined,
                Year: undefined,
              });
              setSearchTerm("");
              setScopeTerm("");
              setStatusTerm("");
              setYearTerm(0);
            }}
          >
            Đặt lại bộ lọc
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Select value={statusTerm} onValueChange={setStatusTerm}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="-- Tất cả trạng thái --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">-- Tất cả trạng thái --</SelectItem>
              <SelectItem value="1">Lập kế hoạch</SelectItem>
              <SelectItem value="2">Đang diễn ra</SelectItem>
              <SelectItem value="3">Đã kết thúc</SelectItem>
            </SelectContent>
          </Select>
          <Select value={scopeTerm} onValueChange={setScopeTerm}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="-- Tất cả phạm vi --" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">-- Tất cả phạm vi --</SelectItem>
              <SelectItem value="1">Cấp chương trình</SelectItem>
              <SelectItem value="2">Cấp cơ sở</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Năm"
            value={yearTerm || ""}
            onChange={(e) => setYearTerm(Number(e.target.value))}
            className="bg-background"
          />
          <InputGroup className="col-span-1 bg-background">
            <InputGroupInput
              placeholder="Tìm kiếm..."
              value={searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!pl-10"
            />
            <InputGroupAddon className="absolute left-0 top-0 h-full px-3 py-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center justify-between">
        <div className="col-span-2 flex items-center gap-2">
          {canAdd && (
            <Button size="sm" onClick={() => showPopupDetail?.("", false)}>
              Thêm
            </Button>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                deleteList?.(
                  table
                    .getSelectedRowModel()
                    .rows.map((row) => (row.original as { Id: string }).Id)
                )
              }
            >
              Xóa
            </Button>
          )}
        </div>
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
