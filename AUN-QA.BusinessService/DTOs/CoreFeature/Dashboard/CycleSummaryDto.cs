namespace AUN_QA.BusinessService.DTOs.CoreFeature.Dashboard
{
    public class DashboardOverviewDto
    {
        public DashboardSummaryDto Summary { get; set; } = new();
        public List<CycleSummaryDto> Cycles { get; set; } = new();
    }

    public class DashboardSummaryDto
    {
        public int ActiveCyclesCount { get; set; }
        public int EvidenceCount { get; set; }
        public int ActionPlansCount { get; set; }
        public int IncompleteActionPlansCount { get; set; }
        public int ExpiringEvidenceCount { get; set; }
        public int UpcomingDeadlineCount { get; set; }
    }

    public class CycleSummaryDto
    {
        public Guid CycleId { get; set; }
        public string CycleName { get; set; } = string.Empty;
        public int CycleStatus { get; set; }
        public DateTime? Deadline { get; set; }
        public string StandardSetName { get; set; } = string.Empty;
        public int ChartType { get; set; }
        public CycleStatsDto Stats { get; set; } = new();
        public List<CriteriaSummaryDto> ChartSeries { get; set; } = new();
        public List<CriteriaSummaryDto> TopCriteria { get; set; } = new();
        public List<CriteriaSummaryDto> BottomCriteria { get; set; } = new();
    }

    public class CycleStatsDto
    {
        public double AvgScore { get; set; }
        public int EvidenceCount { get; set; }
        public int CriteriaEvaluated { get; set; }
        public int CriteriaTotal { get; set; }
        public int ProgressPercent { get; set; }
    }

    public class CriteriaSummaryDto
    {
        public string Name { get; set; } = string.Empty;
        public double Score { get; set; }
    }
}
