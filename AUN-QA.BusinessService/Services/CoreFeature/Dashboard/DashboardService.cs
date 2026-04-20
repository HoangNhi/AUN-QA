using AUN_QA.BusinessService.DTOs.CoreFeature.Dashboard;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.Dashboard
{
    [RegisterClassAsTransient]
    public class DashboardService : IDashboardService
    {
        private const string UserIdClaimType = "name";
        private readonly BusinessContext _context;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ICatalogIntegrationService _catalogService;

        public DashboardService(
            BusinessContext context,
            IHttpContextAccessor contextAccessor,
            ICatalogIntegrationService catalogService)
        {
            _context = context;
            _contextAccessor = contextAccessor;
            _catalogService = catalogService;
        }

        public async Task<DashboardOverviewDto> GetCyclesSummaryAsync()
        {
            var userIdValue = _contextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(x => x.Type == UserIdClaimType)?.Value;

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return new DashboardOverviewDto();
            }

            var cycleIds = await _context.Councils
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.IsActived && !x.IsDeleted)
                .Select(x => x.CycleId)
                .Distinct()
                .ToListAsync();

            if (cycleIds.Count == 0)
            {
                return new DashboardOverviewDto();
            }

            var cycles = await _context.Cycles
                .AsNoTracking()
                .Where(x => cycleIds.Contains(x.Id) && x.Status != 5 && x.IsActived && !x.IsDeleted)
                .ToListAsync();

            var activeCycleIds = cycles.Select(x => x.Id).ToList();
            var now = DateTime.UtcNow;
            var warningThreshold = now.AddDays(30);

            var evidenceCount = await _context.EvidenceCycleMaps
                .AsNoTracking()
                .CountAsync(x => activeCycleIds.Contains(x.CycleId) && x.IsActived && !x.IsDeleted);

            var actionPlansCount = await _context.ActionPlans
                .AsNoTracking()
                .CountAsync(x => activeCycleIds.Contains(x.CycleId) && x.IsActived && !x.IsDeleted);

            var incompleteActionPlansCount = await _context.ActionPlans
                .AsNoTracking()
                .CountAsync(x =>
                    activeCycleIds.Contains(x.CycleId)
                    && x.IsActived
                    && !x.IsDeleted
                    && x.Status != (int)ActionPlanStatus.Completed);

            var expiringEvidenceCount = await (
                from map in _context.EvidenceCycleMaps.AsNoTracking()
                join evidence in _context.Evidences.AsNoTracking()
                    on map.EvidenceId equals evidence.Id
                where activeCycleIds.Contains(map.CycleId)
                    && map.IsActived
                    && !map.IsDeleted
                    && evidence.IsActived
                    && !evidence.IsDeleted
                    && evidence.ExpiryDate.HasValue
                    && evidence.ExpiryDate.Value >= now
                    && evidence.ExpiryDate.Value <= warningThreshold
                select evidence.Id
            )
                .Distinct()
                .CountAsync();

            var upcomingDeadlineCount = cycles.Count(x => x.EndDate >= now && x.EndDate <= warningThreshold);

            var result = new List<CycleSummaryDto>();

            foreach (var cycle in cycles)
            {
                var standardSetInfo = await _catalogService.GetStandardSetInfoAsync(cycle.StandardSetId.ToString());
                var standardRows = _catalogService.GetStandardsWithCriteriaStreamAsync(
                    new GetStandardsWithCriteriaStreamRequest
                    {
                        StandardSetId = cycle.StandardSetId.ToString()
                    });

                var standardNames = new Dictionary<Guid, string>();
                var standardOrders = new Dictionary<Guid, int>();
                await foreach (var row in standardRows)
                {
                    if (!standardNames.ContainsKey(row.StandardId))
                    {
                        standardNames[row.StandardId] = row.StandardName;
                        standardOrders[row.StandardId] = row.StandardOrder;
                    }
                }

                var evaluations = await _context.CriterionEvaluations
                    .AsNoTracking()
                    .Where(x => x.CycleId == cycle.Id && x.IsActived && !x.IsDeleted)
                    .ToListAsync();

                var scoredEvaluations = evaluations
                    .Where(x => x.OfficialScore.HasValue)
                    .ToList();

                var criteriaTotal = evaluations.Count;
                var criteriaEvaluated = scoredEvaluations.Count;
                var rankedStandards = scoredEvaluations
                    .GroupBy(x => x.StandardId)
                    .Select(group => new
                    {
                        StandardId = group.Key,
                        AvgScore = group.Average(x => (double)x.OfficialScore!.Value)
                    })
                    .OrderByDescending(x => x.AvgScore)
                    .ToList();
                var avgScore = rankedStandards.Count > 0
                    ? Math.Round(rankedStandards.Average(x => x.AvgScore), 1)
                    : 0;
                var progressPercent = criteriaTotal > 0
                    ? (int)Math.Round((double)criteriaEvaluated / criteriaTotal * 100)
                    : 0;

                var topCriteria = rankedStandards
                    .Take(2)
                    .Select(x => new CriteriaSummaryDto
                    {
                        Name = standardNames.TryGetValue(x.StandardId, out var standardName)
                            ? standardName
                            : x.StandardId.ToString(),
                        Score = Math.Round(x.AvgScore, 1)
                    })
                    .ToList();

                var topStandardIds = rankedStandards
                    .Take(2)
                    .Select(x => x.StandardId)
                    .ToHashSet();

                var bottomCriteria = rankedStandards
                    .OrderBy(x => x.AvgScore)
                    .Where(x => !topStandardIds.Contains(x.StandardId))
                    .Take(2)
                    .Select(x => new CriteriaSummaryDto
                    {
                        Name = standardNames.TryGetValue(x.StandardId, out var standardName)
                            ? standardName
                            : x.StandardId.ToString(),
                        Score = Math.Round(x.AvgScore, 1)
                    })
                    .ToList();

                var chartSeries = rankedStandards
                    .OrderBy(x => standardOrders.TryGetValue(x.StandardId, out var standardOrder)
                        ? standardOrder
                        : int.MaxValue)
                    .Select(x => new CriteriaSummaryDto
                    {
                        Name = standardNames.TryGetValue(x.StandardId, out var standardName)
                            ? standardName
                            : x.StandardId.ToString(),
                        Score = Math.Round(x.AvgScore, 1)
                    })
                    .ToList();

                var cycleEvidenceCount = await _context.EvidenceCycleMaps
                    .AsNoTracking()
                    .CountAsync(x => x.CycleId == cycle.Id && x.IsActived && !x.IsDeleted);

                result.Add(new CycleSummaryDto
                {
                    CycleId = cycle.Id,
                    CycleName = cycle.Name,
                    CycleStatus = cycle.Status,
                    Deadline = cycle.EndDate,
                    StandardSetName = standardSetInfo.Name,
                    ChartType = standardSetInfo.ChartType,
                    Stats = new CycleStatsDto
                    {
                        AvgScore = avgScore,
                        EvidenceCount = cycleEvidenceCount,
                        CriteriaEvaluated = criteriaEvaluated,
                        CriteriaTotal = criteriaTotal,
                        ProgressPercent = progressPercent
                    },
                    ChartSeries = chartSeries,
                    TopCriteria = topCriteria,
                    BottomCriteria = bottomCriteria
                });
            }

            return new DashboardOverviewDto
            {
                Summary = new DashboardSummaryDto
                {
                    ActiveCyclesCount = cycles.Count,
                    EvidenceCount = evidenceCount,
                    ActionPlansCount = actionPlansCount,
                    IncompleteActionPlansCount = incompleteActionPlansCount,
                    ExpiringEvidenceCount = expiringEvidenceCount,
                    UpcomingDeadlineCount = upcomingDeadlineCount
                },
                Cycles = result
            };
        }
    }
}
