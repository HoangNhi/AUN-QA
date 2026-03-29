import type { CriterionEvaluationSummary } from "../../../types/criterionEvaluation.types";

interface SummaryBarProps {
  summary: CriterionEvaluationSummary | null;
  filterSlot?: React.ReactNode;
}

export function SummaryBar({ summary, filterSlot }: SummaryBarProps) {
  if (!summary) return null;

  const progressPercent =
    summary.TotalCriteria > 0
      ? Math.round((summary.ApprovedCriteria / summary.TotalCriteria) * 100)
      : 0;

  const prerequisiteFailed =
    summary.PrerequisiteTotal - summary.PrerequisitePassed;

  return (
    <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Progress */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Tiến độ
          </span>
          <div className="flex-1 bg-muted rounded-full h-2 min-w-[100px]">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium whitespace-nowrap">
            {summary.ApprovedCriteria}/{summary.TotalCriteria}
          </span>
        </div>

        {/* Prerequisite */}
        <div
          className={`flex items-center gap-1.5 text-sm ${
            prerequisiteFailed > 0 ? "text-red-600" : "text-muted-foreground"
          }`}
        >
          <span className="text-base">⚡</span>
          <span>
            TC điều kiện:{" "}
            <span
              className={`font-medium ${prerequisiteFailed > 0 ? "text-red-600" : "text-green-600"}`}
            >
              {summary.PrerequisitePassed}/{summary.PrerequisiteTotal}
            </span>
          </span>
          {prerequisiteFailed > 0 && (
            <span className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5">
              {prerequisiteFailed} chưa đạt
            </span>
          )}
        </div>

        {/* Failed counts */}
        {(summary.FailedCriteria > 0 || summary.FailedStandards > 0) && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              TC không đạt:{" "}
              <span className="font-medium text-red-600">
                {summary.FailedCriteria}
              </span>
            </span>
            <span>
              TS không đạt:{" "}
              <span className="font-medium text-red-600">
                {summary.FailedStandards}
              </span>
            </span>
          </div>
        )}

        {/* Spacer + filter slot */}
        {filterSlot && (
          <>
            <div className="flex-1" />
            {filterSlot}
          </>
        )}
      </div>
    </div>
  );
}
