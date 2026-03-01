import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { useAuditLog } from "@/features/system/hooks/useAuditLog";
import { getColumns } from "./columns";
import { DiffViewerDialog } from "./DiffViewerDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/datepicker";

export default function AuditLogPage() {
    const {
        data,
        entityNames,
        actions,
        pageRequest,
        setPageRequest,
        selectedLog,
        getList,
        showDetail,
        closeDetail,
        isFetching,
    } = useAuditLog();

    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = () => {
        setPageRequest((prev) => ({ ...prev, TextSearch: searchTerm || undefined, PageIndex: 1 }));
    };

    const handleReset = () => {
        setSearchTerm("");
        setPageRequest({
            PageIndex: 1,
            PageSize: 10,
        });
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                        <div className="space-y-2">
                            <Label>Tìm kiếm</Label>
                            <Input
                                placeholder="Tài khoản, tài nguyên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSearch();
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Hành động</Label>
                            <Select
                                value={pageRequest.Action || "ALL"}
                                onValueChange={(v) =>
                                    setPageRequest((prev) => ({ ...prev, Action: v === "ALL" ? undefined : v, PageIndex: 1 }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    {actions.map((act) => (
                                        <SelectItem key={act} value={act}>
                                            {act}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tài nguyên</Label>
                            <Select
                                value={pageRequest.EntityName || "ALL"}
                                onValueChange={(v) =>
                                    setPageRequest((prev) => ({ ...prev, EntityName: v === "ALL" ? undefined : v, PageIndex: 1 }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    {entityNames.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Kết quả</Label>
                            <Select
                                value={pageRequest.IsSuccess === undefined || pageRequest.IsSuccess === null ? "ALL" : String(pageRequest.IsSuccess)}
                                onValueChange={(v) =>
                                    setPageRequest((prev) => ({
                                        ...prev,
                                        IsSuccess: v === "ALL" ? undefined : v === "true",
                                        PageIndex: 1,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="true">Thành công</SelectItem>
                                    <SelectItem value="false">Thất bại</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Từ ngày</Label>
                            <DatePicker
                                optionLabel="Chọn ngày..."
                                value={pageRequest.FromDate ? new Date(pageRequest.FromDate) : undefined}
                                onChange={(date) =>
                                    setPageRequest((prev) => ({
                                        ...prev,
                                        FromDate: date ? date.toISOString() : undefined,
                                        PageIndex: 1,
                                    }))
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Đến ngày</Label>
                            <DatePicker
                                optionLabel="Chọn ngày..."
                                value={pageRequest.ToDate ? new Date(pageRequest.ToDate) : undefined}
                                onChange={(date) =>
                                    setPageRequest((prev) => ({
                                        ...prev,
                                        ToDate: date ? date.toISOString() : undefined,
                                        PageIndex: 1,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" onClick={handleReset}>
                            Khôi phục
                        </Button>
                        <Button onClick={handleSearch}>Tìm kiếm</Button>
                    </div>

                    <DataTable
                        columns={getColumns(showDetail)}
                        data={data.Data}
                        totalRow={data.TotalRow || 0}
                        pageRequest={pageRequest}
                        setPageRequest={setPageRequest}
                        isLoading={isFetching}
                        onRefresh={getList}
                    />
                </CardContent>
            </Card>

            <DiffViewerDialog
                log={selectedLog}
                open={selectedLog !== null}
                onOpenChange={(op) => !op && closeDetail()}
            />
        </div>
    );
}
