import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "./HomePage";
import { useDashboardCycles } from "@/features/business/routes/Dashboard/hooks/useDashboardCycles";

vi.mock("@/features/business/routes/Dashboard/hooks/useDashboardCycles", () => ({
  useDashboardCycles: vi.fn(),
}));

vi.mock("@/features/business/routes/Dashboard/components/CycleChartSlide", () => ({
  default: ({ cycle }: { cycle: { CycleName: string } }) => <div>{cycle.CycleName}</div>,
}));

vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselPrevious: () => <button type="button">Prev</button>,
  CarouselNext: () => <button type="button">Next</button>,
  CarouselDots: () => <div>Dots</div>,
}));

describe("HomePage", () => {
  it("render đúng 4 thẻ tổng hợp theo spec từ dashboard overview", () => {
    vi.mocked(useDashboardCycles).mockReturnValue({
      data: {
        Summary: {
          ActiveCyclesCount: 2,
          EvidenceCount: 12,
          ActionPlansCount: 5,
          IncompleteActionPlansCount: 3,
          ExpiringEvidenceCount: 1,
          UpcomingDeadlineCount: 1,
        },
        Cycles: [
          {
            CycleId: "cycle-1",
            CycleName: "Chu kỳ 1",
            CycleStatus: 1,
            Deadline: "2026-05-01T00:00:00Z",
            StandardSetName: "Bộ tiêu chuẩn A",
            ChartType: 0,
            Stats: {
              AvgScore: 4.5,
              EvidenceCount: 6,
              CriteriaEvaluated: 10,
              CriteriaTotal: 12,
              ProgressPercent: 83,
            },
            ChartSeries: [],
            TopCriteria: [],
            BottomCriteria: [],
          },
          {
            CycleId: "cycle-2",
            CycleName: "Chu kỳ 2",
            CycleStatus: 2,
            Deadline: "2026-06-01T00:00:00Z",
            StandardSetName: "Bộ tiêu chuẩn B",
            ChartType: 1,
            Stats: {
              AvgScore: 3.5,
              EvidenceCount: 6,
              CriteriaEvaluated: 9,
              CriteriaTotal: 11,
              ProgressPercent: 82,
            },
            ChartSeries: [],
            TopCriteria: [],
            BottomCriteria: [],
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as never);

    render(<HomePage />);

    expect(screen.getByText("Chu kỳ active")).toBeInTheDocument();
    expect(screen.getByText("Kho minh chứng")).toBeInTheDocument();
    expect(screen.getByText("Action Plans")).toBeInTheDocument();
    expect(screen.getByText("Cảnh báo")).toBeInTheDocument();

    expect(screen.getByText("3 chưa hoàn thành")).toBeInTheDocument();
    expect(screen.getByText("1 MC sắp hết hạn · 1 deadline sắp tới")).toBeInTheDocument();
    expect(screen.getByText("Chu kỳ 1")).toBeInTheDocument();
    expect(screen.getByText("Chu kỳ 2")).toBeInTheDocument();
  });
});
