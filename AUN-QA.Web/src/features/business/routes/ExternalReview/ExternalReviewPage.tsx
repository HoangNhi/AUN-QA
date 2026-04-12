import { Loader2, Settings2 } from "lucide-react";
import { useExternalReview } from "./hooks/useExternalReview";
import { useExternalReviewResults } from "./hooks/useExternalReviewResults";
import { useCycleOptionsForExternalReview } from "@/features/business/hooks/useCycleOptionsForExternalReview";
import { useStandardsByCycle } from "@/features/business/hooks/useStandardsByCycle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountTab } from "./tabs/AccountTab";
import { WatermarkTab } from "./tabs/WatermarkTab";
import { ResultsTab } from "./tabs/ResultsTab";
import { ExternalReviewStatus } from "@/features/business/types/externalReview.types";

const STATUS_LABEL: Record<
  number,
  { label: string; className: string }
> = {
  [ExternalReviewStatus.New]: {
    label: "Mới tạo",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  [ExternalReviewStatus.InProgress]: {
    label: "Đang thực hiện",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  [ExternalReviewStatus.Completed]: {
    label: "Đã kết thúc",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function ExternalReviewPage() {
  const { isExternalReviewer } = useAuth();
  const cycleOptionsQuery = useCycleOptionsForExternalReview();
  const {
    selectedCycleId,
    setSelectedCycleId,
    review,
    isLoading,
    isFetching,
    isMutating,
    createReview,
    updateStatus,
    updateWatermark,
    confirmCompletion,
    addAccounts,
    removeAccount,
  } = useExternalReview();

  const results = useExternalReviewResults(review?.Id ?? null);
  const standardsQuery = useStandardsByCycle(selectedCycleId);

  const currentStatus = review?.Status ?? ExternalReviewStatus.New;
  const isSetupReadOnly = isExternalReviewer || review?.IsCompleted === true;
  const isResultsSubmitting = isMutating || results.isMutating;

  return (
    <div className="container mx-auto space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            External Review Setup Portal
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Cấu hình tài khoản, watermark và kết quả đánh giá ngoài theo từng chu kỳ.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <Combobox
              options={cycleOptionsQuery.options}
              loading={cycleOptionsQuery.isLoading}
              value={selectedCycleId}
              onValueChange={(value) => setSelectedCycleId(value)}
              placeholder="Chọn chu kỳ để cấu hình External Review..."
              searchPlaceholder="Tìm chu kỳ..."
              emptyText="Không có chu kỳ khả dụng."
            />
            <Button
              type="button"
              onClick={() => {
                void createReview();
              }}
              disabled={!selectedCycleId || !!review || isMutating || isSetupReadOnly}
            >
              Khởi tạo cho chu kỳ
            </Button>
          </div>
          {isSetupReadOnly ? (
            <p className="text-xs text-muted-foreground">
              Bạn đang ở chế độ chỉ xem cho External Review.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {!selectedCycleId ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Vui lòng chọn chu kỳ để bắt đầu cấu hình External Review.
          </CardContent>
        </Card>
      ) : isLoading || isFetching ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải cấu hình External Review...
          </CardContent>
        </Card>
      ) : !review ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <p className="text-sm text-muted-foreground">
              Chu kỳ này chưa có bản ghi External Review.
            </p>
            <Button
              type="button"
              onClick={() => {
                void createReview();
              }}
              disabled={isMutating}
            >
              Khởi tạo External Review
            </Button>
          </CardContent>
        </Card>
      ) : (
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
              isSubmitting={isMutating}
              onAddAccounts={addAccounts}
              onRemoveAccount={removeAccount}
              isReadOnly={isSetupReadOnly}
            />
          </TabsContent>

          <TabsContent value="watermark" className="mt-0">
            <WatermarkTab
              review={review}
              isSubmitting={isMutating}
              onUpdateStatus={updateStatus}
              onUpdateWatermark={updateWatermark}
              onConfirmCompletion={confirmCompletion}
              isReadOnly={isSetupReadOnly}
            />
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <ResultsTab
              standards={standardsQuery.options}
              results={review.Results || []}
              isSubmitting={isResultsSubmitting}
              onUpsertResult={results.upsertResult}
              onAddFinding={results.addFinding}
              onUpdateFinding={results.updateFinding}
              onDeleteFinding={results.deleteFinding}
              isReadOnly={isSetupReadOnly}
            />
          </TabsContent>
        </Tabs>
      )}

      {review ? (
        <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm">
          <span className="text-muted-foreground">Trạng thái hiện tại:</span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
              STATUS_LABEL[currentStatus]?.className ??
              "bg-gray-100 text-gray-700 border-gray-200"
            }`}
          >
            {STATUS_LABEL[currentStatus]?.label ?? "Không xác định"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default ExternalReviewPage;
