using AUN_QA.BusinessService.DTOs.CoreFeature.Dashboard;
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

        public async Task<List<CycleSummaryDto>> GetCyclesSummaryAsync()
        {
            var userIdValue = _contextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(x => x.Type == UserIdClaimType)?.Value;

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                return new List<CycleSummaryDto>();
            }

            var cycleIds = await _context.Councils
                .AsNoTracking()
                .Where(x => x.UserId == userId && x.IsActived && !x.IsDeleted)
                .Select(x => x.CycleId)
                .Distinct()
                .ToListAsync();

            if (cycleIds.Count == 0)
            {
                return new List<CycleSummaryDto>();
            }

            var cycles = await _context.Cycles
                .AsNoTracking()
                .Where(x => cycleIds.Contains(x.Id) && x.Status != 5 && x.IsActived && !x.IsDeleted)
                .ToListAsync();

            var result = new List<CycleSummaryDto>();

            foreach (var cycle in cycles)
            {
                var standardSetInfo = await _catalogService.GetStandardSetInfoAsync(cycle.StandardSetId.ToString());
                var standardRows = _catalogService.GetStandardsWithCriteriaStreamAsync(
                    new GetStandardsWithCriteriaStreamRequest
                    {
                        StandardSetId = cycle.StandardSetId.ToString()
                    });

                var criterionNames = new Dictionary<Guid, string>();
                await foreach (var row in standardRows)
                {
                    if (!criterionNames.ContainsKey(row.CriterionId))
                    {
                        criterionNames[row.CriterionId] = row.CriterionName;
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
                var avgScore = scoredEvaluations.Count > 0
                    ? Math.Round(scoredEvaluations.Average(x => (double)x.OfficialScore!.Value), 1)
                    : 0;
                var progressPercent = criteriaTotal > 0
                    ? (int)Math.Round((double)criteriaEvaluated / criteriaTotal * 100)
                    : 0;

                var rankedCriteria = scoredEvaluations
                    .GroupBy(x => x.CriterionId)
                    .Select(group => new
                    {
                        CriterionId = group.Key,
                        AvgScore = group.Average(x => (double)x.OfficialScore!.Value)
                    })
                    .OrderByDescending(x => x.AvgScore)
                    .ToList();

                var topCriteria = rankedCriteria
                    .Take(2)
                    .Select(x => new CriteriaSummaryDto
                    {
                        Name = criterionNames.TryGetValue(x.CriterionId, out var criterionName)
                            ? criterionName
                            : x.CriterionId.ToString(),
                        Score = Math.Round(x.AvgScore, 1)
                    })
                    .ToList();

                var bottomCriteria = rankedCriteria
                    .OrderBy(x => x.AvgScore)
                    .Take(2)
                    .Select(x => new CriteriaSummaryDto
                    {
                        Name = criterionNames.TryGetValue(x.CriterionId, out var criterionName)
                            ? criterionName
                            : x.CriterionId.ToString(),
                        Score = Math.Round(x.AvgScore, 1)
                    })
                    .ToList();

                var evidenceCount = await _context.EvidenceCycleMaps
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
                        EvidenceCount = evidenceCount,
                        CriteriaEvaluated = criteriaEvaluated,
                        CriteriaTotal = criteriaTotal,
                        ProgressPercent = progressPercent
                    },
                    TopCriteria = topCriteria,
                    BottomCriteria = bottomCriteria
                });
            }

            return result;
        }
    }
}
