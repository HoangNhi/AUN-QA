import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BarChartWidget from "./BarChartWidget";

describe("BarChartWidget", () => {
  it("dùng chart series thay vì phụ thuộc vào top/bottom criteria", () => {
    render(
      <BarChartWidget
        cycle={
          {
            CycleId: "cycle-1",
            CycleName: "Chu kỳ 1",
            CycleStatus: 1,
            Deadline: "2026-05-01T00:00:00Z",
            StandardSetName: "Bộ tiêu chuẩn A",
            ChartType: 1,
            Stats: {
              AvgScore: 4.25,
              EvidenceCount: 12,
              CriteriaEvaluated: 8,
              CriteriaTotal: 10,
              ProgressPercent: 80,
            },
            ChartSeries: [
              { Name: "TC1", Score: 5.5 },
              { Name: "TC2", Score: 4.2 },
            ],
            TopCriteria: [],
            BottomCriteria: [],
          } as never
        }
      />,
    );

    expect(screen.queryByText("Chưa có dữ liệu tiêu chí để hiển thị")).not.toBeInTheDocument();
    expect(screen.getByText("TC1")).toBeInTheDocument();
  });
});
