import { Check, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FrameworkType } from "../../../types/criterionEvaluation.types";
import { AUN_SCORE_CONFIG } from "../../../types/criterionEvaluation.types";
import {
  getApprovalPanelMode,
  getOfficialResultDisplay,
} from "../utils/resultDisplay";

const SCORE_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const PASS_TEXT = "\u0110\u1ea0T";
const FAIL_TEXT = "KH\u00d4NG \u0110\u1ea0T";

interface ApprovalPanelCardProps {
  framework: FrameworkType;
  isApproved: boolean;
  canApprove: boolean;
  officialScore: number | null;
  officialResult: boolean | null;
  isApproving: boolean;
  onOfficialScoreChange: (score: number | null) => void;
  onOfficialResultChange: (result: boolean | null) => void;
  onApprove: () => void;
}

function getResultToneClass(text: string): string {
  if (text === PASS_TEXT) return "bg-emerald-500/20 text-emerald-300 border-emerald-400/30";
  if (text === FAIL_TEXT) return "bg-red-500/20 text-red-300 border-red-400/30";
  return "bg-slate-500/20 text-slate-200 border-slate-400/30";
}

export function ApprovalPanelCard({
  framework,
  isApproved,
  canApprove,
  officialScore,
  officialResult,
  isApproving,
  onOfficialScoreChange,
  onOfficialResultChange,
  onApprove,
}: ApprovalPanelCardProps) {
  const mode = getApprovalPanelMode({ isApproved, canApprove });
  const resultDisplay = getOfficialResultDisplay({
    framework,
    status: isApproved ? 3 : 0,
    officialScore,
    officialResult,
  });
  const aunLabel =
    framework === "AUN" && officialScore != null
      ? (AUN_SCORE_CONFIG[officialScore] ?? AUN_SCORE_CONFIG[4]).label
      : null;

  return (
    <div className="bg-slate-800 p-6 rounded-[20px] shadow-xl border border-slate-700/80 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
      <div className="relative z-10">
        <h3 className="font-bold text-white mb-1 flex items-center gap-2 text-base">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          {"Ch\u1ed1t & Ph\u00ea duy\u1ec7t"}
        </h3>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          {canApprove
            ? "D\u00e0nh cho Ch\u1ee7 t\u1ecbch H\u0110. Xem x\u00e9t \u00fd ki\u1ebfn \u0111\u1ec3 ch\u1ed1t \u0111i\u1ec3m cu\u1ed1i."
            : "K\u1ebft qu\u1ea3 ch\u1ed1t cu\u1ed1i hi\u1ec3n th\u1ecb cho t\u1ea5t c\u1ea3 th\u00e0nh vi\u00ean h\u1ed9i \u0111\u1ed3ng."}
        </p>

        {mode === "approved-readonly" && (
          <div className="space-y-2">
            <p className="text-sm text-emerald-400 font-semibold text-center py-1">
              {"\u2713 \u0110\u00e3 duy\u1ec7t"}
            </p>
            <div className="flex items-center justify-center">
              <span
                className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${getResultToneClass(resultDisplay.text)}`}
              >
                {resultDisplay.text}
              </span>
            </div>
            {aunLabel && (
              <p className="text-xs text-slate-300 text-center">{aunLabel}</p>
            )}
          </div>
        )}

        {mode === "pending-readonly" && (
          <p className="text-sm text-slate-200 font-medium text-center py-2">
            {"\u0110ang ch\u1edd Ch\u1ee7 t\u1ecbch/PCT ch\u1ed1t k\u1ebft qu\u1ea3."}
          </p>
        )}

        {mode === "approver-edit" && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {framework === "AUN" ? (
              <select
                value={officialScore ?? ""}
                onChange={(e) =>
                  onOfficialScoreChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                disabled={isApproving}
                className="w-full sm:flex-1 text-sm p-3 border border-slate-600 bg-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-inner cursor-pointer disabled:opacity-50"
              >
                <option value="">{"-- Ch\u1ecdn \u0111i\u1ec3m ch\u1ed1t --"}</option>
                {SCORE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} {"\u2014"} {AUN_SCORE_CONFIG[s].label}
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
                  onOfficialResultChange(
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
                <option value="">{"-- Ch\u1ecdn k\u1ebft qu\u1ea3 --"}</option>
                <option value="PASS">{"\u0110\u1ea0T Y\u00caU C\u1ea6U"}</option>
                <option value="FAIL">{"KH\u00d4NG \u0110\u1ea0T"}</option>
              </select>
            )}
            <Button
              onClick={onApprove}
              disabled={
                isApproving ||
                (framework === "AUN" ? !officialScore : officialResult == null)
              }
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {"Duy\u1ec7t"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
