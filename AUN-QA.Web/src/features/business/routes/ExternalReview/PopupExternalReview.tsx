import { useMemo } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useStandardsByCycle } from "@/features/business/hooks/useStandardsByCycle";
import { useExternalReviewResults } from "./hooks/useExternalReviewResults";
import { useExternalReview } from "./hooks/useExternalReview";
import type { ExternalReviewListItem, ExternalReviewStatus } from "@/features/business/types/externalReview.types";
import { AccountTab } from "./tabs/AccountTab";
import { WatermarkTab } from "./tabs/WatermarkTab";
import { ResultsTab } from "./tabs/ResultsTab";

interface PopupExternalReviewProps {
  open: boolean;
  item: ExternalReviewListItem | null;
  onOpenChange: (open: boolean) => void;
  onDataChanged: () => void;
}

const STATUS_LABELS: Record<
  ExternalReviewStatus | number,
  { label: string; className: string }
> = {
  0: { label: "Mới tạo", className: "bg-slate-100 text-slate-700 border-slate-200" },
  1: { label: "Đang thực hiện", className: "bg-amber-50 text-amber-700 border-amber-200" },
  2: { label: "Đã kết thúc", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function getStatusBadgeClass(status: ExternalReviewStatus | number): string {
  return STATUS_LABELS[status]?.className ?? "bg-slate-100 text-slate-700 border-slate-200";
}

function getStatusLabel(status: ExternalReviewStatus | number): string {
  return STATUS_LABELS[status]?.label ?? "Không xác định";
}

export default function PopupExternalReview({
  open,
  item,
  onOpenChange,
  onDataChanged,
}: PopupExternalReviewProps) {
  const { isExternalReviewer } = useAuth();
  const reviewQuery = useExternalReview(item?.CycleId ?? null);
  const review = reviewQuery.review;
  const results = useExternalReviewResults(review?.Id ?? null);
  const standardsQuery = useStandardsByCycle(item?.CycleId);

  const currentStatus = useMemo(
    () => (review?.Status ?? item?.Status ?? 0) as ExternalReviewStatus | number,
    [item?.Status, review?.Status],
  );

  const isReadOnly = isExternalReviewer || review?.IsCompleted === true;

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onDataChanged();
    }
  };

  const handleStatusUpdate = async (status: number) => {
    await reviewQuery.updateStatus(status);
    onDataChanged();
  };

  const handleWatermarkUpdate = async (payload: {
    text?: string | null;
    opacity: number;
    position: number;
  }) => {
    await reviewQuery.updateWatermark(payload);
    onDataChanged();
  };

  const handleConfirmCompletion = async () => {
    await reviewQuery.confirmCompletion();
    onDataChanged();
  };

  const handleAddAccounts = async (userIds: string[]) => {
    await reviewQuery.addAccounts(userIds);
    onDataChanged();
  };

  const handleRemoveAccount = async (accountId: string) => {
    await reviewQuery.removeAccount(accountId);
    onDataChanged();
  };

  const handleUpsertResult = async (payload: {
    standardId: string;
    strengths?: string | null;
  }) => {
    await results.upsertResult(payload);
    onDataChanged();
  };

  const handleAddFinding = async (payload: {
    ExternalReviewResultId: string;
    FindingType: number;
    Content: string;
    CriterionId?: string | null;
  }) => {
    await results.addFinding(payload);
    onDataChanged();
  };

  const handleUpdateFinding = async (payload: {
    FindingId: string;
    FindingType: number;
    Content: string;
    CriterionId?: string | null;
  }) => {
    await results.updateFinding(payload);
    onDataChanged();
  };

  const handleDeleteFinding = async (findingId: string) => {
    await results.deleteFinding(findingId);
    onDataChanged();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="h-screen w-screen max-w-[100vw] grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-none border-0 p-0 sm:max-w-[100vw]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">External review</DialogTitle>

        <header className="sticky top-0 z-30 border-b bg-white px-6 py-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-slate-900">
                {item ? `${item.CycleName} (${item.Year})` : "External Review"}
              </h2>
              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 font-medium",
                    getStatusBadgeClass(currentStatus),
                  )}
                >
                  {getStatusLabel(currentStatus)}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Accounts: {review?.Accounts?.length ?? item?.AccountCount ?? 0}
                </span>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Kết quả: {review?.Results?.length ?? item?.ResultCount ?? 0}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  handleOpenChange(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="min-h-0 overflow-hidden bg-slate-50">
          {isExternalReviewer ? (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
              Bạn đang ở chế độ chỉ xem cho External Review.
            </div>
          ) : null}

          {reviewQuery.isLoading || reviewQuery.isFetching ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải chi tiết External Review...
              </div>
            </div>
          ) : review ? (
            <div className="h-full overflow-auto px-6 py-6">
              <Tabs defaultValue="account" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="watermark">Watermark</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-0">
                  <AccountTab
                    externalReviewId={review.Id}
                    accounts={review.Accounts || []}
                    isSubmitting={reviewQuery.isMutating}
                    onAddAccounts={handleAddAccounts}
                    onRemoveAccount={handleRemoveAccount}
                    isReadOnly={isReadOnly}
                  />
                </TabsContent>

                <TabsContent value="watermark" className="mt-0">
                  <WatermarkTab
                    review={review}
                    isSubmitting={reviewQuery.isMutating}
                    onUpdateStatus={handleStatusUpdate}
                    onUpdateWatermark={handleWatermarkUpdate}
                    onConfirmCompletion={handleConfirmCompletion}
                    isReadOnly={isReadOnly}
                  />
                </TabsContent>

                <TabsContent value="results" className="mt-0">
                  <ResultsTab
                    standards={standardsQuery.options}
                    results={review.Results || []}
                    isSubmitting={reviewQuery.isMutating || results.isMutating}
                    onUpsertResult={handleUpsertResult}
                    onAddFinding={handleAddFinding}
                    onUpdateFinding={handleUpdateFinding}
                    onDeleteFinding={handleDeleteFinding}
                    isReadOnly={isReadOnly}
                  />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-6">
              <Card className="max-w-lg">
                <CardContent className="p-6 text-sm text-slate-600">
                  Không tìm thấy bản ghi External Review cho chu kỳ này.
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
