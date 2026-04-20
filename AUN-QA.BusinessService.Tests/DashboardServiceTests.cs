using System.Security.Claims;
using System.Collections;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Dashboard;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class DashboardServiceTests
{
    [Fact]
    public async Task GetCyclesSummaryAsync_returns_dashboard_overview_with_summary_counts_for_current_user()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var activeCycleId = Guid.NewGuid();
        var secondActiveCycleId = Guid.NewGuid();
        var finishedCycleId = Guid.NewGuid();
        var standardSetId = Guid.NewGuid();
        var secondStandardSetId = Guid.NewGuid();
        var criterionOneId = Guid.NewGuid();
        var criterionTwoId = Guid.NewGuid();
        var criterionThreeId = Guid.NewGuid();
        var standardOneId = Guid.NewGuid();
        var standardTwoId = Guid.NewGuid();
        var standardThreeId = Guid.NewGuid();

        SeedCycle(context, activeCycleId, "Chu ky A", (int)CycleStatus.Act, standardSetId, DateTime.UtcNow.AddDays(12));
        SeedCycle(context, secondActiveCycleId, "Chu ky B", (int)CycleStatus.Check, secondStandardSetId, DateTime.UtcNow.AddDays(45));
        SeedCycle(context, finishedCycleId, "Chu ky C", (int)CycleStatus.Finish, Guid.NewGuid(), DateTime.UtcNow.AddDays(20));
        SeedCouncil(context, activeCycleId, userId);
        SeedCouncil(context, secondActiveCycleId, userId);
        SeedCouncil(context, finishedCycleId, userId);
        SeedCouncil(context, activeCycleId, otherUserId);

        SeedEvaluation(context, activeCycleId, standardOneId, criterionOneId, 7);
        SeedEvaluation(context, activeCycleId, standardOneId, criterionTwoId, 5);
        SeedEvaluation(context, activeCycleId, standardTwoId, criterionThreeId, 2);

        var expiringEvidenceId = Guid.NewGuid();
        var longTermEvidenceId = Guid.NewGuid();
        var secondCycleEvidenceId = Guid.NewGuid();
        var deletedEvidenceId = Guid.NewGuid();

        SeedEvidence(context, expiringEvidenceId, DateTime.UtcNow.AddDays(7));
        SeedEvidence(context, longTermEvidenceId, DateTime.UtcNow.AddDays(90));
        SeedEvidence(context, secondCycleEvidenceId, null);
        SeedEvidence(context, deletedEvidenceId, DateTime.UtcNow.AddDays(5));

        SeedEvidenceMap(context, activeCycleId, expiringEvidenceId, false);
        SeedEvidenceMap(context, activeCycleId, longTermEvidenceId, false);
        SeedEvidenceMap(context, secondActiveCycleId, secondCycleEvidenceId, false);
        SeedEvidenceMap(context, activeCycleId, deletedEvidenceId, true);

        SeedActionPlan(context, activeCycleId, (int)ActionPlanStatus.Completed);
        SeedActionPlan(context, activeCycleId, (int)ActionPlanStatus.InProgress);
        SeedActionPlan(context, secondActiveCycleId, (int)ActionPlanStatus.PendingReview);
        SeedActionPlan(context, finishedCycleId, (int)ActionPlanStatus.Draft);

        context.SaveChanges();

        var catalog = new FakeCatalogIntegrationService
        {
            StandardSetInfo = new StandardSetInfoDto
            {
                EvaluationMode = 1,
                ChartType = 1,
                Name = "AUN-QA 2024"
            },
            Criteria = new[]
            {
                new StandardWithCriteriaDto
                {
                    StandardId = standardOneId,
                    StandardCode = "STD-01",
                    StandardName = "Tieu chuan 1",
                    StandardOrder = 1,
                    CriterionId = criterionOneId,
                    CriterionCode = "CR-01",
                    CriterionName = "Nhan su",
                    IsPrerequisite = false,
                    CriterionOrder = 1
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardOneId,
                    StandardCode = "STD-01",
                    StandardName = "Tieu chuan 1",
                    StandardOrder = 1,
                    CriterionId = criterionTwoId,
                    CriterionCode = "CR-02",
                    CriterionName = "Chuong trinh",
                    IsPrerequisite = false,
                    CriterionOrder = 2
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardTwoId,
                    StandardCode = "STD-02",
                    StandardName = "Tieu chuan 2",
                    StandardOrder = 2,
                    CriterionId = criterionThreeId,
                    CriterionCode = "CR-03",
                    CriterionName = "Minh chung",
                    IsPrerequisite = false,
                    CriterionOrder = 3
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardThreeId,
                    StandardCode = "STD-03",
                    StandardName = "Tieu chuan 3",
                    StandardOrder = 3,
                    CriterionId = Guid.NewGuid(),
                    CriterionCode = "CR-04",
                    CriterionName = "Lien ket",
                    IsPrerequisite = false,
                    CriterionOrder = 4
                }
            }
        };

        var service = CreateService(context, userId, catalog);

        object result = await service.GetCyclesSummaryAsync();
        var summary = GetPropertyValue(result, "Summary");
        var cycles = GetObjectList(result, "Cycles");

        Assert.Equal(2, GetInt32PropertyValue(summary, "ActiveCyclesCount"));
        Assert.Equal(3, GetInt32PropertyValue(summary, "EvidenceCount"));
        Assert.Equal(3, GetInt32PropertyValue(summary, "ActionPlansCount"));
        Assert.Equal(2, GetInt32PropertyValue(summary, "IncompleteActionPlansCount"));
        Assert.Equal(1, GetInt32PropertyValue(summary, "ExpiringEvidenceCount"));
        Assert.Equal(1, GetInt32PropertyValue(summary, "UpcomingDeadlineCount"));

        Assert.Equal(2, cycles.Count);
        Assert.Contains(cycles, cycle =>
            GetGuidPropertyValue(cycle, "CycleId") == activeCycleId
            && GetStringPropertyValue(cycle, "CycleName") == "Chu ky A");
        Assert.Contains(cycles, cycle =>
            GetGuidPropertyValue(cycle, "CycleId") == secondActiveCycleId
            && GetStringPropertyValue(cycle, "CycleName") == "Chu ky B");
    }

    [Fact]
    public async Task GetCyclesSummaryAsync_aggregates_scores_by_standard_and_excludes_overlap_between_top_and_bottom()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = Guid.NewGuid();
        var standardSetId = Guid.NewGuid();
        var standardOneId = Guid.NewGuid();
        var standardTwoId = Guid.NewGuid();
        var standardThreeId = Guid.NewGuid();
        var criterionOneId = Guid.NewGuid();
        var criterionTwoId = Guid.NewGuid();
        var criterionThreeId = Guid.NewGuid();
        var criterionFourId = Guid.NewGuid();

        SeedCycle(context, cycleId, "Chu ky A", (int)CycleStatus.Act, standardSetId, DateTime.UtcNow.AddDays(10));
        SeedCouncil(context, cycleId, userId);

        SeedEvaluation(context, cycleId, standardOneId, criterionOneId, 7);
        SeedEvaluation(context, cycleId, standardOneId, criterionTwoId, 5);
        SeedEvaluation(context, cycleId, standardTwoId, criterionThreeId, 4);
        SeedEvaluation(context, cycleId, standardThreeId, criterionFourId, 2);

        context.SaveChanges();

        var catalog = new FakeCatalogIntegrationService
        {
            StandardSetInfo = new StandardSetInfoDto
            {
                EvaluationMode = 1,
                ChartType = 0,
                Name = "AUN-QA 2024"
            },
            Criteria = new[]
            {
                new StandardWithCriteriaDto
                {
                    StandardId = standardOneId,
                    StandardCode = "STD-01",
                    StandardName = "Tieu chuan 1",
                    StandardOrder = 1,
                    CriterionId = criterionOneId,
                    CriterionCode = "CR-01",
                    CriterionName = "Nhan su",
                    IsPrerequisite = false,
                    CriterionOrder = 1
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardOneId,
                    StandardCode = "STD-01",
                    StandardName = "Tieu chuan 1",
                    StandardOrder = 1,
                    CriterionId = criterionTwoId,
                    CriterionCode = "CR-02",
                    CriterionName = "Chuong trinh",
                    IsPrerequisite = false,
                    CriterionOrder = 2
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardTwoId,
                    StandardCode = "STD-02",
                    StandardName = "Tieu chuan 2",
                    StandardOrder = 2,
                    CriterionId = criterionThreeId,
                    CriterionCode = "CR-03",
                    CriterionName = "Minh chung",
                    IsPrerequisite = false,
                    CriterionOrder = 3
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardThreeId,
                    StandardCode = "STD-03",
                    StandardName = "Tieu chuan 3",
                    StandardOrder = 3,
                    CriterionId = criterionFourId,
                    CriterionCode = "CR-04",
                    CriterionName = "Lien ket",
                    IsPrerequisite = false,
                    CriterionOrder = 4
                }
            }
        };

        var service = CreateService(context, userId, catalog);

        object result = await service.GetCyclesSummaryAsync();
        var cycles = GetObjectList(result, "Cycles");
        var cycle = Assert.Single(cycles);
        var stats = GetPropertyValue(cycle, "Stats");
        var chartSeries = GetObjectList(cycle, "ChartSeries");
        var topCriteria = GetObjectList(cycle, "TopCriteria");
        var bottomCriteria = GetObjectList(cycle, "BottomCriteria");

        Assert.Equal(4.0, GetDoublePropertyValue(stats, "AvgScore"), 1);
        Assert.Equal(
            new[] { "Tieu chuan 1", "Tieu chuan 2", "Tieu chuan 3" },
            chartSeries.Select(item => GetStringPropertyValue(item, "Name")));
        Assert.Equal(new[] { "Tieu chuan 1", "Tieu chuan 2" }, topCriteria.Select(item => GetStringPropertyValue(item, "Name")));
        Assert.Equal(new[] { "Tieu chuan 3" }, bottomCriteria.Select(item => GetStringPropertyValue(item, "Name")));
        Assert.DoesNotContain(
            topCriteria.Select(item => GetStringPropertyValue(item, "Name")),
            name => bottomCriteria.Select(item => GetStringPropertyValue(item, "Name")).Contains(name));
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static DashboardService CreateService(
        BusinessContext context,
        Guid userId,
        ICatalogIntegrationService catalog)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim("name", userId.ToString())
                    },
                    "TestAuth"))
            }
        };

        return new DashboardService(context, accessor, catalog);
    }

    private static void SeedCycle(
        BusinessContext context,
        Guid cycleId,
        string name,
        int status,
        Guid standardSetId,
        DateTime endDate)
    {
        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = name,
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-15),
            EndDate = endDate,
            Status = status,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = standardSetId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedCouncil(BusinessContext context, Guid cycleId, Guid userId)
    {
        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = 3,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedEvaluation(
        BusinessContext context,
        Guid cycleId,
        Guid standardId,
        Guid criterionId,
        int score)
    {
        context.CriterionEvaluations.Add(new CriterionEvaluation
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            StandardId = standardId,
            CriterionId = criterionId,
            Status = 4,
            OfficialScore = score,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedEvidence(BusinessContext context, Guid evidenceId, DateTime? expiryDate)
    {
        context.Evidences.Add(new Evidence
        {
            Id = evidenceId,
            Code = $"EV-{evidenceId.ToString("N")[..6]}",
            Name = $"Evidence {evidenceId.ToString("N")[..6]}",
            FileTypeId = Guid.NewGuid(),
            ExpiryDate = expiryDate,
            Status = (int)EvidenceStatus.Verified,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedEvidenceMap(BusinessContext context, Guid cycleId, Guid evidenceId, bool isDeleted)
    {
        context.EvidenceCycleMaps.Add(new EvidenceCycleMap
        {
            Id = Guid.NewGuid(),
            EvidenceId = evidenceId,
            CycleId = cycleId,
            ReviewStatus = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = isDeleted
        });
    }

    private static void SeedActionPlan(BusinessContext context, Guid cycleId, int status)
    {
        context.ActionPlans.Add(new ActionPlan
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            Title = $"Action plan {Guid.NewGuid():N}",
            Priority = 1,
            Deadline = DateTime.UtcNow.AddDays(15),
            Status = status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static object GetPropertyValue(object source, string propertyName)
    {
        var propertyInfo = source.GetType().GetProperty(propertyName);
        Assert.NotNull(propertyInfo);
        var value = propertyInfo.GetValue(source);
        Assert.NotNull(value);
        return value!;
    }

    private static List<object> GetObjectList(object source, string propertyName)
    {
        var value = GetPropertyValue(source, propertyName);
        return ((IEnumerable)value).Cast<object>().ToList();
    }

    private static int GetInt32PropertyValue(object source, string propertyName)
        => Assert.IsType<int>(GetPropertyValue(source, propertyName));

    private static double GetDoublePropertyValue(object source, string propertyName)
        => Assert.IsType<double>(GetPropertyValue(source, propertyName));

    private static Guid GetGuidPropertyValue(object source, string propertyName)
        => Assert.IsType<Guid>(GetPropertyValue(source, propertyName));

    private static string GetStringPropertyValue(object source, string propertyName)
        => Assert.IsType<string>(GetPropertyValue(source, propertyName));

    private sealed class FakeCatalogIntegrationService : ICatalogIntegrationService
    {
        public StandardSetInfoDto StandardSetInfo { get; init; } = new();

        public IEnumerable<StandardWithCriteriaDto> Criteria { get; init; } = [];

        public Task<int> GetStandardSetEvaluationModeAsync(string standardSetId)
            => Task.FromResult(StandardSetInfo.EvaluationMode);

        public Task<StandardSetInfoDto> GetStandardSetInfoAsync(string standardSetId)
            => Task.FromResult(StandardSetInfo);

        public async IAsyncEnumerable<StandardWithCriteriaDto> GetStandardsWithCriteriaStreamAsync(
            GetStandardsWithCriteriaStreamRequest request,
            CancellationToken cancellationToken = default)
        {
            foreach (var item in Criteria)
            {
                yield return item;
            }

            await Task.CompletedTask;
        }

        public async IAsyncEnumerable<CriterionDto> GetCriterionsForEvidenceStreamAsync(
            GetCriterionsForEvidenceStreamRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;
            yield break;
        }

        public async IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(
            GetStakeholdersStreamRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;
            yield break;
        }

        public async IAsyncEnumerable<FileTypeInfo> GetFileTypesStreamAsync(
            GetFileTypesStreamRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;
            yield break;
        }

        public async IAsyncEnumerable<FileTypeInfo> GetFileTypesByCriterionStreamAsync(
            GetFileTypesByCriterionStreamRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;
            yield break;
        }

        public async IAsyncEnumerable<CriterionRequirementRow> GetRequirementsByStandardSetStreamAsync(
            GetRequirementsByStandardSetStreamRequest request,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;
            yield break;
        }
    }
}
