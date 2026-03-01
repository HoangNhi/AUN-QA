import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import type { AuditLog } from "@/types/auditlog.types";

interface DiffViewerDialogProps {
    log: AuditLog | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DiffViewerDialog({ log, open, onOpenChange }: DiffViewerDialogProps) {
    if (!log) return null;

    const tryParse = (str: string | null) => {
        if (!str) return null;
        try { return JSON.parse(str); }
        catch { return str; }
    };

    const oldVals = tryParse(log.OldValues);
    const newVals = tryParse(log.NewValues);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 gap-6">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">Chi tiết thao tác</DialogTitle>
                        <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                            {log.Action}
                        </Badge>
                    </div>
                    <DialogDescription className="text-base text-foreground/80">
                        <strong>{log.UserName}</strong> đã thao tác trên <strong>{log.EntityName}</strong>
                        {log.EntityId && ` (ID: ${log.EntityId})`}
                    </DialogDescription>
                </DialogHeader>

                {!log.IsSuccess && log.ErrorMessage && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                        <p className="font-semibold mb-1">Lỗi thực thi:</p>
                        <p className="text-sm break-words">{log.ErrorMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 flex-1 min-h-[300px] overflow-hidden">
                    <div className="flex flex-col rounded-lg border bg-muted/30 overflow-hidden shadow-sm">
                        <div className="bg-muted px-4 py-2 border-b text-sm font-semibold text-muted-foreground flex justify-between items-center">
                            <span>Dữ liệu cũ (Old Values)</span>
                        </div>
                        <ScrollArea className="flex-1 p-0">
                            {oldVals ? (
                                <pre className="p-4 text-xs font-mono text-red-600 leading-relaxed max-w-full">
                                    {JSON.stringify(oldVals, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center p-8 text-sm text-muted-foreground italic">
                                    Không có dữ liệu
                                </div>
                            )}
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>

                    <div className="flex flex-col rounded-lg border bg-muted/30 overflow-hidden shadow-sm">
                        <div className="bg-muted px-4 py-2 border-b text-sm font-semibold text-muted-foreground flex justify-between items-center">
                            <span>Dữ liệu mới (New Values)</span>
                        </div>
                        <ScrollArea className="flex-1 p-0">
                            {newVals ? (
                                <pre className="p-4 text-xs font-mono text-green-600 leading-relaxed max-w-full">
                                    {JSON.stringify(newVals, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex items-center justify-center p-8 text-sm text-muted-foreground italic">
                                    Không có dữ liệu
                                </div>
                            )}
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
