import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { surveyCampaignService } from "../../../api/survey-campaign.api";
import type {
  SurveyCampaignGetListPaging,
  AggregatedRatingQuestion,
  AggregatedTextQuestion,
} from "../../../types/survey-campaign.types";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

interface PopupSurveyCampaignCriterionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: SurveyCampaignGetListPaging | null;
}

const CAMPAIGN_STATUS_META: Record<
  number,
  { label: string; className: string }
> = {
  0: { label: "Chưa bắt đầu", className: "bg-slate-100 text-slate-600" },
  1: { label: "Đang diễn ra", className: "bg-blue-100 text-blue-700" },
  2: { label: "Đã kết thúc", className: "bg-emerald-100 text-emerald-700" },
};

const RATING_LABELS = [
  "",
  "1. Hoàn toàn không đồng ý",
  "2. Không đồng ý",
  "3. Bình thường",
  "4. Đồng ý",
  "5. Hoàn toàn đồng ý",
];

interface RatingTableProps {
  questions: AggregatedRatingQuestion[];
  categoryName: string;
}

const RatingTable = ({ questions, categoryName }: RatingTableProps) => {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Category sub-header */}
      <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200">
        <p className="text-xs font-bold text-slate-600 uppercase">
          {categoryName}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th
                className="border border-slate-300 px-2 py-2 text-left font-bold"
                rowSpan={2}
              >
                STT
              </th>
              <th
                className="border border-slate-300 px-2 py-2 text-left font-bold min-w-50"
                rowSpan={2}
              >
                Câu hỏi khảo sát
              </th>
              {[1, 2, 3, 4, 5].map((score) => (
                <th
                  key={score}
                  className="border border-slate-300 px-1 py-2 font-bold text-center"
                  colSpan={2}
                >
                  <span className="text-[9px] leading-tight block">
                    {RATING_LABELS[score].split(". ")[0]}
                  </span>
                </th>
              ))}
              <th
                className="border border-slate-300 px-2 py-2 text-center font-bold"
                rowSpan={2}
              >
                Tổng
              </th>
            </tr>
            <tr className="bg-slate-100">
              {[1, 2, 3, 4, 5].map((score) => (
                <th
                  key={`${score}-subs`}
                  className="border border-slate-300 px-1 py-1 font-bold"
                  style={{ width: "40px" }}
                >
                  <span className="block text-[9px]">SL</span>
                </th>
              ))}
              {[1, 2, 3, 4, 5].map((score) => (
                <th
                  key={`${score}-percent`}
                  className="border border-slate-300 px-1 py-1 font-bold"
                  style={{ width: "35px" }}
                >
                  <span className="block text-[9px]">%</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => {
              const counts = [
                q.Score1Count,
                q.Score2Count,
                q.Score3Count,
                q.Score4Count,
                q.Score5Count,
              ];
              const total = q.Total || 0;

              return (
                <tr key={q.QuestionId} className="hover:bg-slate-50">
                  <td className="border border-slate-300 px-2 py-2 font-semibold text-center">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-300 px-2 py-2 text-left">
                    <span className="block text-[10px] leading-tight max-w-xs">
                      {q.Content}
                    </span>
                  </td>
                  {counts.map((count, scoreIdx) => (
                    <td
                      key={`${q.QuestionId}-${scoreIdx}-count`}
                      className="border border-slate-300 px-1 py-2 text-center font-semibold text-[9px]"
                    >
                      {count}
                    </td>
                  ))}
                  {counts.map((count, scoreIdx) => {
                    const percent =
                      total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
                    return (
                      <td
                        key={`${q.QuestionId}-${scoreIdx}-percent`}
                        className="border border-slate-300 px-1 py-2 text-center text-[9px]"
                      >
                        {percent}%
                      </td>
                    );
                  })}
                  <td className="border border-slate-300 px-2 py-2 text-center font-bold text-[9px]">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface OpenQuestionChartProps {
  question: AggregatedTextQuestion;
}

const OpenQuestionChart = ({ question }: OpenQuestionChartProps) => {
  if (!question.Answers || question.Answers.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded border border-slate-200 text-sm text-slate-500">
        <p className="font-semibold mb-1">{question.Content}</p>
        <p className="text-xs">Không có dữ liệu trả lời</p>
      </div>
    );
  }

  const chartData = question.Answers.map((ans) => ({
    name: ans.Content.length > 40 ? ans.Content.substring(0, 40) + "..." : ans.Content,
    value: ans.Frequency,
    fullName: ans.Content,
  }));

  const chartConfig = {
    frequency: {
      label: "Số lần",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-800">{question.Content}</p>
      <ChartContainer config={chartConfig} className="h-auto">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 180, right: 20, top: 5, bottom: 5 }}
        >
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={175}
            tick={{ fontSize: 10 }}
            interval={0}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "none",
              borderRadius: "4px",
              color: "white",
              fontSize: "12px",
            }}
            formatter={(value: unknown) => {
              if (typeof value === "number") {
                return `${value} lần`;
              }
              return String(value);
            }}
            labelFormatter={(label: unknown) => {
              if (typeof label === "string") {
                const fullName = chartData.find((d) => d.name === label)?.fullName;
                return fullName || label;
              }
              return String(label);
            }}
          />
          <Bar dataKey="value" fill="var(--color-frequency)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export function PopupSurveyCampaignCriterion({
  open,
  onOpenChange,
  campaign,
}: PopupSurveyCampaignCriterionProps) {
  const [activeTab, setActiveTab] = useState<"general" | "results">("general");

  const { data: sessions = [] } = useQuery({
    queryKey: ["criterionEvaluation", "surveyCampaign", "sessions", campaign?.Id],
    queryFn: async () => {
      const res = await surveyCampaignService.getListSession({
        PageIndex: 1,
        PageSize: 1000,
        TextSearch: null,
        CampaignId: campaign!.Id,
        Status: undefined,
      });
      return res.Data?.Data ?? [];
    },
    enabled: open && !!campaign?.Id,
  });

  const { data: aggregated, isLoading: isAggLoading } = useQuery({
    queryKey: ["criterionEvaluation", "aggregated", campaign?.Id],
    queryFn: () => surveyCampaignService.getAggregatedResults(campaign!.Id),
    enabled: activeTab === "results" && !!campaign?.Id,
    select: (res) => res.Data,
  });

  const completedSessionCount = useMemo(
    () => sessions.filter((session) => session.Status === 3).length,
    [sessions],
  );

  const statusMeta = campaign
    ? CAMPAIGN_STATUS_META[campaign.Status] || {
        label: "Không xác định",
        className: "bg-slate-200 text-slate-700",
      }
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle>{campaign?.Name ?? "Đợt khảo sát"}</DialogTitle>
          <DialogDescription>
            Xem thông tin và kết quả khảo sát (chỉ đọc)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {!campaign ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Không có dữ liệu khảo sát
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "general" | "results")}
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 shrink-0">
                <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                <TabsTrigger value="results">Kết quả khảo sát</TabsTrigger>
              </TabsList>

              {/* Tab 1: General Info */}
              <TabsContent value="general" className="mt-4 flex-1 overflow-y-auto">
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                  {/* Section header with blue left-border */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <div className="h-6 w-1 bg-blue-600 rounded-full" />
                    <h3 className="font-semibold text-gray-700">Thông tin chung</h3>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Tên khảo sát</p>
                      <p className="font-semibold text-slate-800">{campaign.Name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Chu kỳ đánh giá</p>
                      <p className="font-semibold text-slate-800">
                        {campaign.Cycle || "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Loại đối tượng</p>
                      <p className="font-semibold text-slate-800">
                        {campaign.Stakeholder || "--"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Trạng thái</p>
                      {statusMeta && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Session stats */}
                  <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Tổng số người tham gia</p>
                      <p className="font-semibold text-slate-800">
                        {sessions.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Đã hoàn thành</p>
                      <p className="font-semibold text-slate-800">
                        {completedSessionCount}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Results */}
              <TabsContent
                value="results"
                className="mt-4 flex-1 overflow-y-auto"
              >
                {isAggLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <p className="text-sm text-slate-500">
                        Đang tải dữ liệu khảo sát...
                      </p>
                    </div>
                  </div>
                ) : !aggregated || aggregated.Topics.length === 0 ? (
                  <div className="bg-white rounded-lg border p-6 text-center text-slate-500">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Không có dữ liệu khảo sát để hiển thị</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Topics */}
                    {aggregated.Topics.map((topic) => (
                      <div
                        key={topic.TopicId}
                        className="bg-white rounded-lg border shadow-sm overflow-hidden"
                      >
                        {/* Topic header */}
                        <div className="px-4 py-3 bg-slate-50 border-b flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-600">
                            {topic.Sort}.
                          </span>
                          <span className="font-semibold text-slate-800">
                            {topic.Title}
                          </span>
                        </div>

                        <div className="p-4 space-y-6">
                          {/* Rating questions by category */}
                          {topic.Categories.map((category) =>
                            category.Questions.length > 0 ? (
                              <RatingTable
                                key={category.CategoryId}
                                questions={category.Questions}
                                categoryName={category.Name}
                              />
                            ) : null,
                          )}

                          {/* Open questions charts */}
                          {topic.TextQuestions.length > 0 && (
                            <div className="border-t pt-4 space-y-4">
                              <p className="text-xs font-bold text-slate-600 uppercase">
                                Câu hỏi mở
                              </p>
                              {topic.TextQuestions.map((tq) => (
                                <OpenQuestionChart
                                  key={tq.TextQuestionId}
                                  question={tq}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
