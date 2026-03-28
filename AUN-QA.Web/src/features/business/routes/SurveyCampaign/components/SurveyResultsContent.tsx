import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import { surveyCampaignService } from "@/features/business/api/survey-campaign.api";
import type {
  AggregatedRatingQuestion,
  AggregatedTextQuestion,
} from "@/features/business/types/survey-campaign.types";

interface SurveyResultsContentProps {
  campaignId: string;
  enabled: boolean;
}

// ============================================================================
// RatingTable Component
// ============================================================================

interface RatingTableProps {
  questions: AggregatedRatingQuestion[];
}

// Column width constants for RatingTable
const COL_WIDTHS = {
  ROW_NUM: 36,
  QUESTION: 140,
  SCORE_VALUE: 32,
  PERCENTAGE: 42,
  TOTAL: 60,
} as const;

const RatingTable: React.FC<RatingTableProps> = ({ questions }) => {
  const RATING_LABELS = [
    "1. Hoàn toàn không đồng ý",
    "2. Không đồng ý",
    "3. Bình thường",
    "4. Đồng ý",
    "5. Hoàn toàn đồng ý",
  ];
  const SCORE_STYLES = [
    "bg-red-50 text-red-700",
    "bg-orange-50 text-orange-700",
    "bg-yellow-50 text-yellow-700",
    "bg-green-50 text-green-700",
    "bg-emerald-50 text-emerald-700",
  ];

  const getScoreCount = (question: AggregatedRatingQuestion, scoreIndex: number): number => {
    switch (scoreIndex) {
      case 0:
        return question.Score1Count;
      case 1:
        return question.Score2Count;
      case 2:
        return question.Score3Count;
      case 3:
        return question.Score4Count;
      case 4:
        return question.Score5Count;
      default:
        return 0;
    }
  };

  const calculatePercentage = (value: number, total: number): string => {
    if (total === 0) return "0";
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm border-collapse"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: `${COL_WIDTHS.ROW_NUM}px` }} />
          <col style={{ width: `${COL_WIDTHS.QUESTION}px` }} />
          {[1, 2, 3, 4, 5].map((s) => (
            <React.Fragment key={s}>
              <col style={{ width: `${COL_WIDTHS.SCORE_VALUE}px` }} />
              <col style={{ width: `${COL_WIDTHS.PERCENTAGE}px` }} />
            </React.Fragment>
          ))}
          <col style={{ width: `${COL_WIDTHS.TOTAL}px` }} />
        </colgroup>

        {/* Row 1: "Ý kiến phản hồi" header */}
        <thead>
          <tr className="border-b">
            <th className="border-r px-2 py-2 text-left font-semibold">STT</th>
            <th className="border-r px-2 py-2 text-left font-semibold">
              Câu hỏi
            </th>
            <th
              colSpan={10}
              className="px-2 py-2 text-center font-semibold bg-blue-100 text-blue-700"
            >
              Ý kiến phản hồi
            </th>
            <th className="border-l px-2 py-2 text-center font-semibold">
              Tổng
            </th>
          </tr>

          {/* Row 2: Score labels (1-5) with colored backgrounds */}
          <tr className="border-b">
            <th className="border-r px-1 py-1 text-xs text-slate-500"></th>
            <th className="border-r px-1 py-1 text-xs text-slate-500"></th>
            {RATING_LABELS.map((label, idx) => (
              <th
                key={`label-${idx}`}
                colSpan={2}
                className={`${SCORE_STYLES[idx]} px-1 py-1 text-xs font-semibold`}
              >
                {label}
              </th>
            ))}
            <th className="border-l px-1 py-1 text-xs text-slate-500"></th>
          </tr>

          {/* Row 3: SL / % columns */}
          <tr className="border-b bg-slate-50">
            <th className="border-r px-1 py-1 text-xs text-slate-600"></th>
            <th className="border-r px-1 py-1 text-xs text-slate-600"></th>
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={`header-${s}`}>
                <th className="px-1 py-1 text-xs font-medium text-slate-600">
                  SL
                </th>
                <th className="px-1 py-1 text-xs font-medium text-slate-600">
                  %
                </th>
              </React.Fragment>
            ))}
            <th className="border-l px-1 py-1 text-xs text-slate-600"></th>
          </tr>
        </thead>

        {/* Data rows */}
        <tbody>
          {questions.map((question, idx) => {
            const total = question.Total;
            return (
              <tr key={question.QuestionId} className="border-b hover:bg-slate-50">
                <td className="border-r px-2 py-2 text-xs font-medium text-slate-700">
                  {idx + 1}
                </td>
                <td className="border-r px-2 py-2 text-xs text-slate-700">
                  {question.Content}
                </td>

                {/* Score columns: SL / % interleaved */}
                {[0, 1, 2, 3, 4].map((scoreIdx) => {
                  const score = getScoreCount(question, scoreIdx);
                  const percentage = calculatePercentage(score, total);
                  const isZero = score === 0;

                  return (
                    <React.Fragment key={`score-${scoreIdx}`}>
                      <td
                        className={`px-1 py-2 text-center text-xs font-semibold ${
                          isZero ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        {score}
                      </td>
                      <td
                        className={`px-1 py-2 text-center text-xs ${
                          isZero ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {percentage}%
                      </td>
                    </React.Fragment>
                  );
                })}

                {/* Total column */}
                <td className="border-l px-2 py-2 text-center text-xs font-semibold text-slate-700">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// OpenQuestionChart Component
// ============================================================================

// Chart rendering constants
const CHART_ROW_HEIGHT = 40;
const CHART_BASE_HEIGHT = 60;

interface OpenQuestionChartProps {
  question: AggregatedTextQuestion;
}

const OpenQuestionChart: React.FC<OpenQuestionChartProps> = ({ question }) => {
  const chartData = useMemo(() => {
    if (!question.Answers || question.Answers.length === 0) {
      return [];
    }

    return question.Answers.map((answer) => ({
      text: answer.Content,
      count: answer.Frequency,
    }));
  }, [question.Answers]);

  if (chartData.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-slate-400">
        Không có phản hồi
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartData.length * CHART_ROW_HEIGHT + CHART_BASE_HEIGHT}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 20, left: 300, bottom: 10 }}
      >
        <XAxis type="number" />
        <YAxis
          dataKey="text"
          type="category"
          width={290}
          tick={{ fontSize: 12 }}
          interval={0}
        />
        <Tooltip
          formatter={(value) => [value, "Số lượng"]}
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
          }}
        />
        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index % 2 === 0 ? "#3b82f6" : "#6366f1"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// ============================================================================
// SurveyResultsContent Component
// ============================================================================

export const SurveyResultsContent: React.FC<SurveyResultsContentProps> = ({
  campaignId,
  enabled,
}) => {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ["surveyCampaign", "aggregatedResults", campaignId],
    queryFn: () => surveyCampaignService.getAggregatedResults(campaignId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const aggregated = response?.Data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500">Đang tải kết quả khảo sát...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500">
        <AlertCircle className="w-8 h-8" />
        <p>Không thể tải kết quả khảo sát</p>
      </div>
    );
  }

  if (!aggregated || !aggregated.Topics || aggregated.Topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500">
        <AlertCircle className="w-8 h-8" />
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {aggregated.Topics.map((topic) => (
        <div key={topic.TopicId}>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            {topic.Title}
          </h3>

          {/* Rating Questions grouped by Category */}
          {topic.Categories && topic.Categories.length > 0 && (
            <div className="space-y-4">
              {topic.Categories.map((category) => (
                <div key={category.CategoryId} className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-600">
                    {category.Name}
                  </h4>
                  <RatingTable questions={category.Questions} />
                </div>
              ))}
            </div>
          )}

          {/* Open-Ended Questions */}
          {topic.TextQuestions && topic.TextQuestions.length > 0 && (
            <div className="space-y-3">
              {topic.TextQuestions.map((question) => (
                <div key={question.TextQuestionId} className="space-y-2">
                  <p className="text-sm text-slate-700">{question.Content}</p>
                  <OpenQuestionChart question={question} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SurveyResultsContent;
