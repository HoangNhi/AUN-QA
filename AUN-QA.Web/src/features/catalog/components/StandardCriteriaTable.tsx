import { ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  useStandardsWithCriteria,
  getRequirementSummary,
} from "@/features/catalog/hooks/useStandardsWithCriteria";

interface StandardCriteriaTableProps {
  cycleId: string;
  fileTypeId: string;
  label?: string;
  emptyMessage?: string;
}

const StandardCriteriaTable = ({
  cycleId,
  fileTypeId,
  label = "Danh sách tiêu chuẩn liên kết:",
  emptyMessage = "Vui lòng chọn chu kỳ và loại tài liệu.",
}: StandardCriteriaTableProps) => {
  const {
    standardsWithCriteria,
    criteriaLoading,
    criteriaError,
    expandedStandardIds,
    toggleStandard,
  } = useStandardsWithCriteria(cycleId, fileTypeId);

  return (
    <div className="mt-4">
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <div className="rounded-md border bg-background">
        {criteriaLoading ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Đang tải danh sách tiêu chuẩn...
          </div>
        ) : criteriaError ? (
          <div className="px-4 py-6 text-center text-sm text-red-500">
            {criteriaError}
          </div>
        ) : !cycleId || !fileTypeId ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : standardsWithCriteria.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu tiêu chuẩn.
          </div>
        ) : (
          <div className="divide-y divide-muted">
            {standardsWithCriteria.map((standard) => {
              const criterions = standard.Criterions || [];
              const mandatoryCount = criterions.filter(
                (criterion) =>
                  getRequirementSummary(criterion.CriterionRequirements)
                    .isMandatory,
              ).length;

              return (
                <div key={standard.Id}>
                  <button
                    type="button"
                    className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                    onClick={() => toggleStandard(standard.Id)}
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">
                        {standard.Code} - {standard.Name}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{criterions.length} tiêu chí</span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          Bắt buộc: {mandatoryCount}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-slate-700">
                      {expandedStandardIds[standard.Id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                  {expandedStandardIds[standard.Id] && (
                    <div className="bg-slate-50/60 px-3 pb-4">
                      <div className="space-y-3 pt-2">
                        {criterions.map((criterion) => {
                          const summary = getRequirementSummary(
                            criterion.CriterionRequirements,
                          );
                          const isMandatory = summary.isMandatory;
                          const requirementCount =
                            criterion.CriterionRequirements?.length || 0;

                          return (
                            <div
                              key={criterion.Id}
                              className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm animate-in transition-shadow hover:shadow-md ${
                                isMandatory
                                  ? "border-l-4 border-l-red-300"
                                  : "border-l-4 border-l-slate-200"
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 space-y-2">
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                    {criterion.Code}
                                  </span>
                                  <div className="text-sm font-medium leading-6 text-slate-800">
                                    {criterion.Name}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span
                                    className={
                                      summary.isMandatory
                                        ? "rounded-full bg-red-100 px-2 py-0.5 text-red-700"
                                        : "rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"
                                    }
                                  >
                                    {summary.isMandatory
                                      ? "Bắt buộc"
                                      : "Không bắt buộc"}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                    Số lượng: {summary.minQuantity || "-"}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                                    Yêu cầu: {requirementCount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardCriteriaTable;
