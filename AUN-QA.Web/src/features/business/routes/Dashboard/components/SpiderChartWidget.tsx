import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import type { CycleSummary } from "@/features/business/types/dashboard.types";

interface Props {
  cycle: CycleSummary;
}

const chartConfig = {
  score: {
    label: "Điểm",
    color: "hsl(var(--chart-1))",
  },
} as const;

const SpiderChartWidget = ({ cycle }: Props) => {
  const allCriteria = [...cycle.TopCriteria, ...cycle.BottomCriteria];

  if (allCriteria.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
        Chưa có dữ liệu tiêu chí để hiển thị
      </div>
    );
  }

  const chartData = allCriteria.map((item) => ({
    criterion: item.Name.length > 16 ? `${item.Name.slice(0, 16)}…` : item.Name,
    score: item.Score,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 7]} tick={{ fontSize: 9 }} />
        <Radar
          name="Điểm"
          dataKey="score"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.25}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
      </RadarChart>
    </ChartContainer>
  );
};

export default SpiderChartWidget;
