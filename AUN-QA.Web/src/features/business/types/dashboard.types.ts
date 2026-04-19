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

export interface CycleSummary {
  CycleId: string;
  CycleName: string;
  CycleStatus: number;
  Deadline?: string | null;
  StandardSetName: string;
  ChartType: DashboardChartType | number;
  Stats: CycleStats;
  TopCriteria: CriteriaSummary[];
  BottomCriteria: CriteriaSummary[];
}
