import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { evidenceCycleMapService } from "../../../api/evidenceCycleMap.api";
import { surveyCampaignService } from "../../../api/survey-campaign.api";
import PopupEvidenceCycleMap from "../../EvidenceCycleMap/PopupEvidenceCycleMap";
import { PopupSurveyCampaignCriterion } from "./PopupSurveyCampaignCriterion";
import { getCompletedCampaignsForCycle } from "../../../utils/criterionEvaluationSurvey";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFileUrl } from "@/lib/utils";
import {
  X,
  Eye,
  ChevronDown,
  ChevronRight,
  Loader2,
  Zap,
  FileEdit,
  FolderOpen,
  ExternalLink,
  Users,
  Target,
  ThumbsUp,
  AlertCircle,
  Lightbulb,
  Check,
  Undo2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ApproveEvaluationRequest,
  CriterionEvidence,
  CriterionEvaluationItem,
  EvaluationSubmission,
  EvaluationSubmissionRequest,
  FrameworkType,
} from "../../../types/criterionEvaluation.types";
import { AUN_SCORE_CONFIG } from "../../../types/criterionEvaluation.types";
import type { SurveyCampaignGetListPaging } from "../../../types/survey-campaign.types";

interface CriterionPopupProps {
  item: CriterionEvaluationItem;
  submissions: EvaluationSubmission[];
  evidences: CriterionEvidence[];
  cycleId: string;
  mySubmission: EvaluationSubmissionRequest | null;
  isMySubmissionLoading: boolean;
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
type RequiredFieldError = Partial<
  Record<"CurrentState" | "Strengths" | "Weaknesses" | "ActionPlan", string>
>;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}


function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function EvaluationForm({
  item,
  framework,
  mySubmission,
  viewingSubmission,
  getDisplayName,
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
  getDisplayName: (submission: EvaluationSubmission) => string;
  cycleStatus: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: (req: EvaluationSubmissionRequest) => Promise<void>;
  onClearViewing: () => void;
}) {
  const isReadOnly =
    !canSubmit ||
    cycleStatus !== 2 ||
    item.Status === 3 ||
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
  const [errors, setErrors] = useState<RequiredFieldError>({});

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

  const isViewing = viewingSubmission !== null;

  const textareaClass = (focusColor: string, hasError: boolean = false) =>
    isViewing
      ? "w-full text-sm p-3.5 rounded-xl outline-none bg-slate-100 text-slate-600 border-transparent cursor-not-allowed resize-none border"
      : `w-full text-sm p-3.5 rounded-xl outline-none transition-all resize-y bg-slate-50/50 border text-slate-700 placeholder:text-slate-400 focus:bg-white ${
          hasError
            ? "border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
            : `border-slate-300 ${focusColor}`
        }`;

  const validateRequiredFields = (): boolean => {
    const nextErrors: RequiredFieldError = {};

    if (!form.CurrentState?.trim()) {
      nextErrors.CurrentState = "Vui lòng nhập mô tả thực trạng.";
    }
    if (!form.Strengths?.trim()) {
      nextErrors.Strengths = "Vui lòng nhập điểm mạnh.";
    }
    if (!form.Weaknesses?.trim()) {
      nextErrors.Weaknesses = "Vui lòng nhập điểm tồn tại / gap.";
    }
    if (!form.ActionPlan?.trim()) {
      nextErrors.ActionPlan = "Vui lòng nhập đề xuất kế hoạch hành động.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmitClick = async () => {
    if (!validateRequiredFields()) return;
    await onSubmit({ ...form, CriterionEvaluationId: item.Id });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Form header */}
      {isViewing ? (
        <div className="flex items-center gap-3 bg-amber-100/50 border border-amber-200 p-3 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-base">
              Đang xem phiếu của {getDisplayName(viewingSubmission)}
            </p>
            <p className="text-xs text-amber-700">
              Chế độ chỉ đọc — bạn không thể chỉnh sửa.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-base">
              Phiếu Đánh giá Cá nhân
            </p>
            <p className="text-xs text-slate-500">
              Nhập nhận định độc lập và đề xuất mức điểm cho tiêu chí này.
            </p>
          </div>
        </div>
      )}

      {/* Form card */}
      <div
        className={`rounded-[20px] shadow-sm border p-5 flex flex-col gap-5 transition-colors ${isViewing ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200/60"}`}
      >
        {/* Thực trạng */}
        <div>
          <label className="flex items-center gap-2 mb-2">
            <Target
              className={`w-4 h-4 ${isViewing ? "text-slate-400" : "text-blue-500"}`}
            />
            <span
              className={`font-bold text-sm ${isViewing ? "text-slate-500" : "text-slate-700"}`}
            >
              Mô tả Thực trạng
            </span>
          </label>
          <textarea
            rows={3}
            readOnly={isReadOnly}
            value={displayForm.CurrentState ?? ""}
            onChange={(e) => {
              if (isReadOnly) return;
              setForm((f) => ({ ...f, CurrentState: e.target.value }));
              setErrors((prev) => ({ ...prev, CurrentState: undefined }));
            }}
            className={textareaClass(
              "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
              !!errors.CurrentState,
            )}
            placeholder={isReadOnly ? "" : "Nhận định của bạn về thực trạng tiêu chí..."}
          />
          {!isReadOnly && errors.CurrentState && (
            <p className="text-xs text-rose-600 mt-1">{errors.CurrentState}</p>
          )}
        </div>

        {/* Điểm mạnh & Tồn tại — 2 cột */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <ThumbsUp
                className={`w-4 h-4 ${isViewing ? "text-slate-400" : "text-emerald-500"}`}
              />
              <span
                className={`font-bold text-sm ${isViewing ? "text-slate-500" : "text-slate-700"}`}
              >
                Điểm mạnh (Strengths)
              </span>
            </label>
            <textarea
              rows={3}
              readOnly={isReadOnly}
              value={displayForm.Strengths ?? ""}
              onChange={(e) => {
                if (isReadOnly) return;
                setForm((f) => ({ ...f, Strengths: e.target.value }));
                setErrors((prev) => ({ ...prev, Strengths: undefined }));
              }}
              className={textareaClass(
                "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
                !!errors.Strengths,
              )}
              placeholder={isReadOnly ? "" : "Tiêu chí này có điểm mạnh gì?"}
            />
          {!isReadOnly && errors.Strengths && (
            <p className="text-xs text-rose-600 mt-1">{errors.Strengths}</p>
          )}
          </div>
          <div>
            <label className="flex items-center gap-2 mb-2">
              <AlertCircle
                className={`w-4 h-4 ${isViewing ? "text-slate-400" : "text-rose-500"}`}
              />
              <span
                className={`font-bold text-sm ${isViewing ? "text-slate-500" : "text-slate-700"}`}
              >
                Điểm tồn tại / Gap
              </span>
            </label>
            <textarea
              rows={3}
              readOnly={isReadOnly}
              value={displayForm.Weaknesses ?? ""}
              onChange={(e) => {
                if (isReadOnly) return;
                setForm((f) => ({ ...f, Weaknesses: e.target.value }));
                setErrors((prev) => ({ ...prev, Weaknesses: undefined }));
              }}
              className={textareaClass(
                "focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10",
                !!errors.Weaknesses,
              )}
              placeholder={isReadOnly ? "" : "Những điểm nào chưa đạt yêu cầu?"}
            />
          {!isReadOnly && errors.Weaknesses && (
            <p className="text-xs text-rose-600 mt-1">{errors.Weaknesses}</p>
          )}
          </div>
        </div>

        {/* Kế hoạch hành động */}
        <div>
          <label className="flex items-center gap-2 mb-2">
            <Lightbulb
              className={`w-4 h-4 ${isViewing ? "text-slate-400" : "text-purple-500"}`}
            />
            <span
              className={`font-bold text-sm ${isViewing ? "text-slate-500" : "text-slate-700"}`}
            >
              Đề xuất Kế hoạch hành động
            </span>
          </label>
          <textarea
            rows={2}
            readOnly={isReadOnly}
            value={displayForm.ActionPlan ?? ""}
            onChange={(e) => {
              if (isReadOnly) return;
              setForm((f) => ({ ...f, ActionPlan: e.target.value }));
              setErrors((prev) => ({ ...prev, ActionPlan: undefined }));
            }}
            className={textareaClass(
              "focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10",
              !!errors.ActionPlan,
            )}
            placeholder={isReadOnly ? "" : "Đề xuất các bước khắc phục cho các tồn tại..."}
          />
          {!isReadOnly && errors.ActionPlan && (
            <p className="text-xs text-rose-600 mt-1">{errors.ActionPlan}</p>
          )}
        </div>

        <div className="h-px w-full bg-slate-200" />

        {/* Điểm đề xuất + Gửi phiếu */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl ${isViewing ? "bg-slate-100" : "bg-blue-50/50"}`}
        >
          <div className="flex-1 w-full flex items-center gap-3">
            <label
              className={`text-sm font-bold whitespace-nowrap ${isViewing ? "text-slate-500" : "text-slate-700"}`}
            >
              {isViewing ? "Mức điểm đề xuất:" : "Đề xuất điểm:"}
            </label>
            {framework === "AUN" ? (
              <Select
                disabled={isReadOnly}
                value={displayForm.ProposedScore?.toString() ?? ""}
                onValueChange={(val) =>
                  !isReadOnly &&
                  setForm((f) => ({
                    ...f,
                    ProposedScore: val ? Number(val) : null,
                  }))
                }
              >
                <SelectTrigger className="flex-1 font-semibold">
                  <SelectValue placeholder="-- Chọn mức --" />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s} — {AUN_SCORE_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                disabled={isReadOnly}
                value={
                  displayForm.ProposedResult === true
                    ? "PASS"
                    : displayForm.ProposedResult === false
                      ? "FAIL"
                      : ""
                }
                onValueChange={(val) =>
                  !isReadOnly &&
                  setForm((f) => ({
                    ...f,
                    ProposedResult:
                      val === "PASS" ? true : val === "FAIL" ? false : null,
                  }))
                }
              >
                <SelectTrigger className="flex-1 font-semibold">
                  <SelectValue placeholder="-- Chọn kết quả --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASS">ĐẠT YÊU CẦU</SelectItem>
                  <SelectItem value="FAIL">KHÔNG ĐẠT</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {isViewing ? (
            <button
              onClick={onClearViewing}
              className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Undo2 className="w-4 h-4" /> Quay lại phiếu của tôi
            </button>
          ) : (
            !isReadOnly && (
              <button
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-blue-600/20 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {mySubmission ? "Cập nhật phiếu" : "Gửi Phiếu"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export function CriterionPopup({
  item,
  submissions,
  evidences,
  cycleId,
  mySubmission,
  isMySubmissionLoading,
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
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(!canApprove);
  const [isSurveyOpen, setIsSurveyOpen] = useState(!canApprove);
  const [officialScore, setOfficialScore] = useState<number | null>(
    item.OfficialScore,
  );
  const [officialResult, setOfficialResult] = useState<boolean | null>(
    item.OfficialResult,
  );
  const [viewingEcmId, setViewingEcmId] = useState<string | null>(null);
  const [viewingSurveyCampaign, setViewingSurveyCampaign] =
    useState<SurveyCampaignGetListPaging | null>(null);

  const { data: ecmData, isLoading: isEcmLoading } = useQuery({
    queryKey: ["evidenceCycleMap", viewingEcmId],
    queryFn: () => evidenceCycleMapService.getById(viewingEcmId!),
    enabled: !!viewingEcmId,
  });
  const { data: surveyCampaigns = [], isLoading: isSurveyCampaignsLoading } =
    useQuery<SurveyCampaignGetListPaging[]>({
      queryKey: ["criterionEvaluation", "surveyCampaigns", "popup", cycleId],
      queryFn: async () => {
        const res = await surveyCampaignService.getList({
          PageIndex: 1,
          PageSize: 1000,
          TextSearch: null,
          CycleId: cycleId,
          StakeholderType: undefined,
        });
        if (!res.Success) return [];
        return getCompletedCampaignsForCycle(res.Data?.Data ?? [], cycleId);
      },
      enabled: !!cycleId,
      refetchOnMount: "always",
    });

  const getDisplayName = (submission: EvaluationSubmission): string => {
    return submission.EvaluatorName;
  };

  const isApproved = item.Status === 3;

  const handleApprove = async () => {
    await onApprove({
      CriterionEvaluationId: item.Id,
      OfficialScore: framework === "AUN" ? officialScore : undefined,
      OfficialResult: framework === "MOET" ? officialResult : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-325 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {item.IsPrerequisite && (
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <span className="font-mono text-xs text-slate-500 shrink-0">
              {item.CriterionCode}
            </span>
            <span className="text-slate-300">|</span>
            <h2 className="font-semibold text-sm text-slate-800 truncate max-w-150">
              {item.CriterionName}
            </h2>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                {!isApproved && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isApproved ? "bg-emerald-500" : "bg-blue-500"}`}
                />
              </span>
              <span className="text-sm font-semibold text-slate-600">
                {isApproved ? "Đã duyệt" : "Đang xử lý"}
              </span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200" />
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0 bg-slate-100/50">
          <div className="flex-1 overflow-y-auto p-5 lg:p-8">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Left: Evaluation Form */}
              <div className="flex-1 w-full min-w-0">
                {isMySubmissionLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <EvaluationForm
                    item={item}
                    framework={framework}
                    mySubmission={mySubmission}
                    viewingSubmission={viewingSubmission}
                    getDisplayName={getDisplayName}
                    cycleStatus={cycleStatus}
                    canSubmit={canSubmit}
                    isSubmitting={isSubmitting}
                    onSubmit={onSubmit}
                    onClearViewing={() => setViewingSubmission(null)}
                  />
                )}
              </div>

              {/* Right: Reference + Council + Approval */}
              <div className="w-full lg:w-105 flex flex-col gap-5 shrink-0">
                {/* 1. Dữ liệu Tham chiếu */}
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-base">
                      Dữ liệu Tham chiếu
                    </h3>
                  </div>

                  {/* Evidence section */}
                  <div className="mb-3">
                    <button
                      className="w-full flex items-center justify-between mb-2 group outline-none"
                      onClick={() => setIsEvidenceOpen((v) => !v)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                          Minh chứng đính kèm
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {evidences.length}
                        </span>
                      </div>
                      {isEvidenceOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      )}
                    </button>
                    {isEvidenceOpen && (
                      <div className="space-y-2 mt-1">
                        {evidences.length === 0 ? (
                          <p className="text-xs text-slate-400 py-2 px-3">
                            Chưa có minh chứng nào được liên kết.
                          </p>
                        ) : (
                          evidences.map((ev) => (
                            <div
                              key={ev.Id}
                              onClick={() => setViewingEcmId(ev.EvidenceCycleMapId)}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-blue-50/50 hover:border-blue-100 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 pr-2 min-w-0">
                                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                                <p
                                  className="text-sm font-semibold text-slate-700 truncate group-hover:text-blue-700 transition-colors"
                                  title={`[${ev.Code}] ${ev.Name}`}
                                >
                                  [{ev.Code}] {ev.Name}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {isEvidenceOpen && isSurveyOpen && (
                    <div className="h-px w-full bg-slate-100 my-2" />
                  )}

                  {/* Survey section */}
                  <div>
                    <button
                      className="w-full flex items-center justify-between mb-2 group outline-none"
                      onClick={() => setIsSurveyOpen((v) => !v)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
                          Số liệu Khảo sát
                        </span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {surveyCampaigns.length}
                        </span>
                      </div>
                      {isSurveyOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                      )}
                    </button>
                    {isSurveyOpen && (
                      <div className="space-y-2 mt-1">
                        {isSurveyCampaignsLoading ? (
                          <p className="text-xs text-slate-400 py-2 px-3">
                            Đang tải dữ liệu khảo sát...
                          </p>
                        ) : surveyCampaigns.length === 0 ? (
                          <p className="text-xs text-slate-400 py-2 px-3">
                            Chưa có campaign khảo sát đã kết thúc trong chu kỳ này.
                          </p>
                        ) : (
                          surveyCampaigns.map((campaign) => (
                            <div
                              key={campaign.Id}
                              onClick={() => setViewingSurveyCampaign(campaign)}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-purple-50/60 hover:border-purple-100 cursor-pointer transition-colors group"
                            >
                              <div className="min-w-0 pr-2">
                                <p
                                  className="text-sm font-semibold text-slate-700 truncate group-hover:text-purple-700 transition-colors"
                                  title={campaign.Name}
                                >
                                  {campaign.Name}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  {campaign.Stakeholder || "Stakeholder"} - Đã kết thúc
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0 transition-colors" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Hội đồng đã nộp */}
                <div className="bg-white rounded-[20px] shadow-sm border border-slate-200/60 p-5">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-800 text-base">
                        Hội đồng đã nộp
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                      {submissions.length} Phiếu
                    </span>
                  </div>

                  {submissions.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      Chưa có thành viên nào gửi phiếu.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-55 overflow-y-auto pr-1">
                      {submissions.map((sub) => (
                        <div
                          key={sub.Id}
                          className={`p-3 border rounded-xl flex items-center justify-between transition-colors ${
                            viewingSubmission?.Id === sub.Id
                              ? "bg-blue-50 border-blue-200"
                              : "bg-slate-50 border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 rounded-full shrink-0">
                              <AvatarImage
                                src={getFileUrl(sub.EvaluatorAvatar)}
                                alt={getDisplayName(sub)}
                              />
                              <AvatarFallback className="rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-200 shadow-sm">
                                {getInitials(getDisplayName(sub))}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold text-slate-800 leading-tight">
                                {getDisplayName(sub)}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {formatTimeAgo(sub.UpdatedAt ?? sub.CreatedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            {framework === "AUN" && sub.ProposedScore != null && (
                              (() => {
                                const config =
                                  AUN_SCORE_CONFIG[sub.ProposedScore] ||
                                  AUN_SCORE_CONFIG[4];
                                return (
                                  <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${config.bgClass} ${config.textClass}`}
                                  >
                                    {config.label} ({sub.ProposedScore})
                                  </span>
                                );
                              })()
                            )}
                            {framework === "MOET" &&
                              sub.ProposedResult != null && (
                                <span
                                  className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                    sub.ProposedResult
                                      ? "bg-emerald-100/80 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {sub.ProposedResult ? "ĐẠT" : "KHÔNG ĐẠT"}
                                </span>
                              )}
                            <button
                              onClick={() =>
                                setViewingSubmission(
                                  viewingSubmission?.Id === sub.Id ? null : sub,
                                )
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                viewingSubmission?.Id === sub.Id
                                  ? "text-blue-700 bg-blue-100"
                                  : "text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                              }`}
                              title="Xem phiếu"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Approval panel */}
                {canApprove && (
                  <div className="bg-slate-800 p-6 rounded-[20px] shadow-xl border border-slate-700/80 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
                    <div className="relative z-10">
                      <h3 className="font-bold text-white mb-1 flex items-center gap-2 text-base">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        Chốt & Phê duyệt
                      </h3>
                      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                        Dành cho Chủ tịch HĐ. Xem xét ý kiến để chốt điểm cuối.
                      </p>

                      {isApproved ? (
                        <p className="text-sm text-emerald-400 font-semibold text-center py-2">
                          ✓ Đã duyệt
                        </p>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          {framework === "AUN" ? (
                            <select
                              value={officialScore ?? ""}
                              onChange={(e) =>
                                setOfficialScore(
                                  e.target.value ? Number(e.target.value) : null,
                                )
                              }
                              disabled={isApproving}
                              className="w-full sm:flex-1 text-sm p-3 border border-slate-600 bg-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-inner cursor-pointer disabled:opacity-50"
                            >
                              <option value="">-- Chọn điểm chốt --</option>
                              {SCORE_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s} — {AUN_SCORE_CONFIG[s].label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={
                                officialResult === true
                                  ? "PASS"
                                  : officialResult === false
                                    ? "FAIL"
                                    : ""
                              }
                              onChange={(e) =>
                                setOfficialResult(
                                  e.target.value === "PASS"
                                    ? true
                                    : e.target.value === "FAIL"
                                      ? false
                                      : null,
                                )
                              }
                              disabled={isApproving}
                              className="w-full sm:flex-1 text-sm p-3 border border-slate-600 bg-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-inner cursor-pointer disabled:opacity-50"
                            >
                              <option value="">-- Chọn kết quả --</option>
                              <option value="PASS">ĐẠT YÊU CẦU</option>
                              <option value="FAIL">KHÔNG ĐẠT</option>
                            </select>
                          )}
                          <Button
                            onClick={handleApprove}
                            disabled={
                              isApproving ||
                              (framework === "AUN"
                                ? !officialScore
                                : officialResult == null)
                            }
                            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                          >
                            {isApproving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Duyệt
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PopupSurveyCampaignCriterion
        open={!!viewingSurveyCampaign}
        onOpenChange={(open) => {
          if (!open) setViewingSurveyCampaign(null);
        }}
        campaign={viewingSurveyCampaign}
      />
      {/* Evidence popup */}
      {viewingEcmId && (
        <PopupEvidenceCycleMap
          evidenceCycleMap={ecmData?.Data ?? null}
          isOpen={!!viewingEcmId}
          onOpenChange={(open) => {
            if (!open) setViewingEcmId(null);
          }}
          readOnly={true}
          isLoading={isEcmLoading}
          saveChange={() => {}}
          onApprove={() => {}}
        />
      )}
    </div>
  );
}

