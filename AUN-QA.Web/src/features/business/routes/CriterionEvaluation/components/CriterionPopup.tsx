import { useState } from "react";
import { X, Eye, ChevronDown, ChevronRight, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type {
  ApproveEvaluationRequest,
  CriterionEvaluationItem,
  EvaluationSubmission,
  EvaluationSubmissionRequest,
  FrameworkType,
} from "../../../types/criterionEvaluation.types";

interface CriterionPopupProps {
  item: CriterionEvaluationItem;
  submissions: EvaluationSubmission[];
  mySubmission: EvaluationSubmissionRequest | null;
  framework: FrameworkType;
  cycleStatus: number;
  canSubmit: boolean;
  canApprove: boolean;
  isSubmitting: boolean;
  isApproving: boolean;
  onClose: () => void;
  onSubmit: (request: EvaluationSubmissionRequest) => Promise<void>;
  onApprove: (request: ApproveEvaluationRequest) => Promise<void>;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

function ScoreSelector({
  framework,
  value,
  boolValue,
  onChange,
  onBoolChange,
  disabled,
}: {
  framework: FrameworkType;
  value: number | null | undefined;
  boolValue: boolean | null | undefined;
  onChange: (v: number | null) => void;
  onBoolChange: (v: boolean | null) => void;
  disabled?: boolean;
}) {
  if (framework === "AUN") {
    return (
      <div className="flex gap-1.5 flex-wrap">
        {SCORE_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === s ? null : s)}
            className={`w-8 h-8 rounded text-sm font-medium border transition-colors ${
              value === s
                ? "bg-blue-600 text-white border-blue-600"
                : "border-border hover:bg-muted"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {s}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {[
        { label: "Đạt", val: true },
        { label: "Không đạt", val: false },
      ].map(({ label, val }) => (
        <button
          key={label}
          type="button"
          disabled={disabled}
          onClick={() => onBoolChange(boolValue === val ? null : val)}
          className={`px-4 py-1.5 rounded text-sm font-medium border transition-colors ${
            boolValue === val
              ? val
                ? "bg-green-600 text-white border-green-600"
                : "bg-red-600 text-white border-red-600"
              : "border-border hover:bg-muted"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function EvaluationForm({
  item,
  framework,
  mySubmission,
  viewingSubmission,
  cycleStatus,
  canSubmit,
  isSubmitting,
  onSubmit,
  onClearViewing,
}: {
  item: CriterionEvaluationItem;
  framework: FrameworkType;
  mySubmission: EvaluationSubmissionRequest | null;
  viewingSubmission: EvaluationSubmission | null;
  cycleStatus: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: (req: EvaluationSubmissionRequest) => Promise<void>;
  onClearViewing: () => void;
}) {
  const isReadOnly =
    !canSubmit ||
    cycleStatus !== 2 || // Not Ongoing
    item.Status === 3 || // Already approved
    viewingSubmission !== null;

  const [form, setForm] = useState<EvaluationSubmissionRequest>({
    Id: mySubmission?.Id,
    CriterionEvaluationId: item.Id,
    CurrentState: mySubmission?.CurrentState ?? "",
    Strengths: mySubmission?.Strengths ?? "",
    Weaknesses: mySubmission?.Weaknesses ?? "",
    ActionPlan: mySubmission?.ActionPlan ?? "",
    ProposedScore: mySubmission?.ProposedScore ?? null,
    ProposedResult: mySubmission?.ProposedResult ?? null,
  });

  const displayForm = viewingSubmission
    ? {
        CurrentState: viewingSubmission.CurrentState ?? "",
        Strengths: viewingSubmission.Strengths ?? "",
        Weaknesses: viewingSubmission.Weaknesses ?? "",
        ActionPlan: viewingSubmission.ActionPlan ?? "",
        ProposedScore: viewingSubmission.ProposedScore,
        ProposedResult: viewingSubmission.ProposedResult,
      }
    : form;

  const handleSubmit = async () => {
    await onSubmit({
      ...form,
      CriterionEvaluationId: item.Id,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {viewingSubmission && (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
          <span>
            Đang xem phiếu của{" "}
            <strong>{viewingSubmission.EvaluatorName}</strong>
          </span>
          <button
            onClick={onClearViewing}
            className="text-xs underline hover:no-underline"
          >
            Quay lại phiếu của tôi
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            Mô tả thực trạng
          </Label>
          <Textarea
            value={displayForm.CurrentState ?? ""}
            onChange={(e) =>
              !isReadOnly && setForm((f) => ({ ...f, CurrentState: e.target.value }))
            }
            readOnly={isReadOnly}
            rows={3}
            placeholder={isReadOnly ? "" : "Mô tả thực trạng của tiêu chí..."}
            className="resize-none text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            Điểm mạnh
          </Label>
          <Textarea
            value={displayForm.Strengths ?? ""}
            onChange={(e) =>
              !isReadOnly && setForm((f) => ({ ...f, Strengths: e.target.value }))
            }
            readOnly={isReadOnly}
            rows={3}
            placeholder={isReadOnly ? "" : "Điểm mạnh của chương trình..."}
            className="resize-none text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            Tồn tại / Gap
          </Label>
          <Textarea
            value={displayForm.Weaknesses ?? ""}
            onChange={(e) =>
              !isReadOnly && setForm((f) => ({ ...f, Weaknesses: e.target.value }))
            }
            readOnly={isReadOnly}
            rows={3}
            placeholder={isReadOnly ? "" : "Các điểm tồn tại hoặc khoảng cách..."}
            className="resize-none text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            Kế hoạch hành động
          </Label>
          <Textarea
            value={displayForm.ActionPlan ?? ""}
            onChange={(e) =>
              !isReadOnly && setForm((f) => ({ ...f, ActionPlan: e.target.value }))
            }
            readOnly={isReadOnly}
            rows={3}
            placeholder={isReadOnly ? "" : "Đề xuất kế hoạch cải tiến..."}
            className="resize-none text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1">
            {framework === "AUN" ? "Đề xuất điểm (1-7)" : "Đề xuất kết quả"}
          </Label>
          <ScoreSelector
            framework={framework}
            value={displayForm.ProposedScore}
            boolValue={displayForm.ProposedResult}
            onChange={(v) => !isReadOnly && setForm((f) => ({ ...f, ProposedScore: v }))}
            onBoolChange={(v) =>
              !isReadOnly && setForm((f) => ({ ...f, ProposedResult: v }))
            }
            disabled={isReadOnly}
          />
        </div>
      </div>

      {!isReadOnly && !viewingSubmission && (
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {mySubmission ? "Cập nhật phiếu" : "Gửi Phiếu"}
        </Button>
      )}
    </div>
  );
}

export function CriterionPopup({
  item,
  submissions,
  mySubmission,
  framework,
  cycleStatus,
  canSubmit,
  canApprove,
  isSubmitting,
  isApproving,
  onClose,
  onSubmit,
  onApprove,
}: CriterionPopupProps) {
  const [viewingSubmission, setViewingSubmission] =
    useState<EvaluationSubmission | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [officialScore, setOfficialScore] = useState<number | null>(
    item.OfficialScore,
  );
  const [officialResult, setOfficialResult] = useState<boolean | null>(
    item.OfficialResult,
  );

  const handleApprove = async () => {
    await onApprove({
      CriterionEvaluationId: item.Id,
      OfficialScore: framework === "AUN" ? officialScore : undefined,
      OfficialResult: framework === "MOET" ? officialResult : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-[1300px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start gap-2">
            {item.IsPrerequisite && (
              <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="text-xs font-mono text-muted-foreground">
                {item.CriterionCode}
              </p>
              <h2 className="font-semibold text-sm mt-0.5 max-w-[700px]">
                {item.CriterionName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Evaluation Form */}
          <div className="w-[480px] flex-shrink-0 overflow-y-auto border-r px-6 py-4">
            <h3 className="text-sm font-medium mb-3">Phiếu đánh giá (Biểu 04)</h3>
            <EvaluationForm
              item={item}
              framework={framework}
              mySubmission={mySubmission}
              viewingSubmission={viewingSubmission}
              cycleStatus={cycleStatus}
              canSubmit={canSubmit}
              isSubmitting={isSubmitting}
              onSubmit={onSubmit}
              onClearViewing={() => setViewingSubmission(null)}
            />
          </div>

          {/* Right: Reference + Council + Approval */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
            {/* Evidence (collapsible) */}
            <div>
              <button
                className="flex items-center gap-2 w-full text-sm font-medium py-1"
                onClick={() => setIsEvidenceOpen((v) => !v)}
              >
                {isEvidenceOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Minh chứng liên kết ({item.EvidenceCount})
              </button>
              {isEvidenceOpen && (
                <div className="mt-2 rounded-lg border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                  {item.EvidenceCount === 0
                    ? "Chưa có minh chứng nào được liên kết."
                    : "Danh sách minh chứng sẽ được hiển thị ở đây."}
                </div>
              )}
            </div>

            {/* Council submissions */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                Phiếu thành viên Hội đồng ({submissions.length})
              </h3>
              {submissions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Chưa có thành viên nào gửi phiếu.
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {submissions.map((sub) => (
                    <div
                      key={sub.Id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                        viewingSubmission?.Id === sub.Id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sub.EvaluatorName}</span>
                        {framework === "AUN" && sub.ProposedScore != null && (
                          <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                            {sub.ProposedScore}/7
                          </span>
                        )}
                        {framework === "MOET" && sub.ProposedResult != null && (
                          <span
                            className={`text-xs rounded px-1.5 py-0.5 ${
                              sub.ProposedResult
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {sub.ProposedResult ? "Đạt" : "Không đạt"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setViewingSubmission(
                            viewingSubmission?.Id === sub.Id ? null : sub,
                          )
                        }
                        className="p-1 rounded hover:bg-muted transition-colors"
                        title="Xem phiếu"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval panel — CTH / PCT only */}
            {canApprove && (
              <div className="rounded-xl bg-slate-800 text-white px-5 py-4 mt-auto">
                <h3 className="text-sm font-semibold mb-3">
                  Chốt kết quả chính thức
                </h3>
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-2">
                    {framework === "AUN"
                      ? "Điểm AUN (1-7)"
                      : "Kết quả MOET"}
                  </p>
                  <ScoreSelector
                    framework={framework}
                    value={officialScore}
                    boolValue={officialResult}
                    onChange={setOfficialScore}
                    onBoolChange={setOfficialResult}
                    disabled={item.Status === 3 || isApproving}
                  />
                </div>
                {item.Status !== 3 ? (
                  <Button
                    onClick={handleApprove}
                    disabled={
                      isApproving ||
                      (framework === "AUN" ? !officialScore : officialResult == null)
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Duyệt
                  </Button>
                ) : (
                  <p className="text-xs text-green-400 text-center">
                    ✓ Đã duyệt
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
