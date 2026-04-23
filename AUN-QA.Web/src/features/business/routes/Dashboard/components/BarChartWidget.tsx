import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  DashboardEvaluationMode,
  type CycleSummary,
} from "@/features/business/types/dashboard.types";

interface Props {
  cycle: CycleSummary;
}

const BarChartWidget = ({ cycle }: Props) => {
  const series = cycle.ChartSeries ?? [];
  const isPassFail = cycle.EvaluationMode === DashboardEvaluationMode.PassFail;

  if (series.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Chưa có dữ liệu tiêu chí để hiển thị
      </div>
    );
  }

  const chartData = series.map((item) => ({
    criterion: item.Name.length > 12 ? `${item.Name.slice(0, 12)}…` : item.Name,
    score: item.Score,
  }));

  const chartConfig = {
    score: {
      label: isPassFail ? "Tiêu chí đạt" : "Điểm",
      color: "hsl(var(--chart-1))",
    },
  } as const;

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="criterion" tick={{ fontSize: 9 }} />
        <YAxis domain={isPassFail ? [0, "auto"] : [0, 7]} tick={{ fontSize: 9 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.criterion}
              fill={
                isPassFail
                  ? "hsl(var(--chart-1))"
                  : entry.score >= 4
                    ? "hsl(var(--chart-1))"
                    : "hsl(var(--chart-4))"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};

export default BarChartWidget;
