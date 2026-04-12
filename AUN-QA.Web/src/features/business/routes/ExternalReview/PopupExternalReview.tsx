import { useEffect, useMemo, useState } from "react";
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
  const [headerStatus, setHeaderStatus] = useState<string>(String(currentStatus));

  useEffect(() => {
    setHeaderStatus(String(currentStatus));
  }, [currentStatus]);

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

  const handleCreateAndLinkAccount = async (payload: {
    fullname: string;
    username: string;
    email: string;
    password: string;
  }) => {
    await reviewQuery.createAndLinkAccount(payload);
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

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-3.5">
          <div className="flex min-w-0 items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-slate-900">
                {item ? `${item.CycleName} (${item.Year})` : "External Review"}
              </h2>
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    getStatusBadgeClass(currentStatus),
                  )}
                >
                  {getStatusLabel(currentStatus)}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">
                  {review?.Accounts?.length ?? item?.AccountCount ?? 0} chuyên gia
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500">
                  {review?.Results?.length ?? item?.ResultCount ?? 0} kết quả
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {!isReadOnly && review ? (
                <>
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <select
                      value={headerStatus}
                      onChange={(e) => setHeaderStatus(e.target.value)}
                      className="rounded border-0 bg-transparent px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                    >
                      <option value="0">Mới tạo</option>
                      <option value="1">Đang thực hiện</option>
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleStatusUpdate(Number(headerStatus))}
                      disabled={reviewQuery.isMutating}
                      className="h-7 px-3 text-xs"
                    >
                      Cập nhật
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleConfirmCompletion()}
                    disabled={reviewQuery.isMutating || review.IsCompleted}
                    className="h-8"
                  >
                    {review.IsCompleted ? "Đã hoàn tất" : "Xác nhận hoàn tất"}
                  </Button>
                </>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => { handleOpenChange(false); }}
                className="ml-1"
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
                  <TabsTrigger value="account">Tài khoản Chuyên gia</TabsTrigger>
                  <TabsTrigger value="watermark">Cấu hình Watermark</TabsTrigger>
                  <TabsTrigger value="results">Kết quả ĐGN</TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="mt-0">
                  <AccountTab
                    externalReviewId={review.Id}
                    accounts={review.Accounts || []}
                    isSubmitting={reviewQuery.isMutating}
                    onCreateAndLinkAccount={handleCreateAndLinkAccount}
                    onRemoveAccount={handleRemoveAccount}
                    isReadOnly={isReadOnly}
                  />
                </TabsContent>

                <TabsContent value="watermark" className="mt-0">
                  <WatermarkTab
                    review={review}
                    isSubmitting={reviewQuery.isMutating}
                    onUpdateWatermark={handleWatermarkUpdate}
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
