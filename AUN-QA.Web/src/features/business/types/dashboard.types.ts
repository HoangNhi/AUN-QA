export enum DashboardChartType {
  SpiderChart = 0,
  BarChart = 1,
}

export interface CriteriaSummary {
  Name: string;
  Score: number;
}

export interface CycleStats {
  AvgScore: number;
  EvidenceCount: number;
  CriteriaEvaluated: number;
  CriteriaTotal: number;
  ProgressPercent: number;
}

export interface DashboardSummary {
  ActiveCyclesCount: number;
  EvidenceCount: number;
  ActionPlansCount: number;
  IncompleteActionPlansCount: number;
  ExpiringEvidenceCount: number;
  UpcomingDeadlineCount: number;
}

export interface CycleSummary {
  CycleId: string;
  CycleName: string;
  CycleStatus: number;
  Deadline?: string | null;
  StandardSetName: string;
  ChartType: DashboardChartType | number;
  Stats: CycleStats;
  ChartSeries: CriteriaSummary[];
  TopCriteria: CriteriaSummary[];
  BottomCriteria: CriteriaSummary[];
}

export interface DashboardOverview {
  Summary: DashboardSummary;
  Cycles: CycleSummary[];
}

export const EMPTY_DASHBOARD_OVERVIEW: DashboardOverview = {
  Summary: {
    ActiveCyclesCount: 0,
    EvidenceCount: 0,
    ActionPlansCount: 0,
    IncompleteActionPlansCount: 0,
    ExpiringEvidenceCount: 0,
    UpcomingDeadlineCount: 0,
  },
  Cycles: [],
};
