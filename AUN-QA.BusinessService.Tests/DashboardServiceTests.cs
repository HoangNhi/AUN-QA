using System.Security.Claims;
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
    public async Task GetCyclesSummaryAsync_returns_active_cycles_for_the_current_user()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var activeCycleId = Guid.NewGuid();
        var finishedCycleId = Guid.NewGuid();
        var standardSetId = Guid.NewGuid();
        var criterionOneId = Guid.NewGuid();
        var criterionTwoId = Guid.NewGuid();
        var criterionThreeId = Guid.NewGuid();

        SeedCycle(context, activeCycleId, "Chu ky A", 4, standardSetId, DateTime.UtcNow.AddDays(12));
        SeedCycle(context, finishedCycleId, "Chu ky B", 5, Guid.NewGuid(), DateTime.UtcNow.AddDays(20));
        SeedCouncil(context, activeCycleId, userId);
        SeedCouncil(context, finishedCycleId, userId);
        SeedCouncil(context, activeCycleId, otherUserId);

        SeedEvaluation(context, activeCycleId, Guid.NewGuid(), criterionOneId, 6);
        SeedEvaluation(context, activeCycleId, Guid.NewGuid(), criterionTwoId, 4);
        SeedEvaluation(context, activeCycleId, Guid.NewGuid(), criterionThreeId, 2);

        SeedEvidenceMap(context, activeCycleId, false);
        SeedEvidenceMap(context, activeCycleId, true);

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
                    StandardId = Guid.NewGuid(),
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
                    StandardId = Guid.NewGuid(),
                    StandardCode = "STD-02",
                    StandardName = "Tieu chuan 2",
                    StandardOrder = 2,
                    CriterionId = criterionTwoId,
                    CriterionCode = "CR-02",
                    CriterionName = "Chuong trinh",
                    IsPrerequisite = false,
                    CriterionOrder = 2
                },
                new StandardWithCriteriaDto
                {
                    StandardId = Guid.NewGuid(),
                    StandardCode = "STD-03",
                    StandardName = "Tieu chuan 3",
                    StandardOrder = 3,
                    CriterionId = criterionThreeId,
                    CriterionCode = "CR-03",
                    CriterionName = "Minh chung",
                    IsPrerequisite = false,
                    CriterionOrder = 3
                }
            }
        };

        var service = CreateService(context, userId, catalog);

        var result = await service.GetCyclesSummaryAsync();

        Assert.Single(result);
        var summary = result[0];

        Assert.Equal(activeCycleId, summary.CycleId);
        Assert.Equal("Chu ky A", summary.CycleName);
        Assert.Equal(4, summary.CycleStatus);
        Assert.True(summary.Deadline.HasValue);
        Assert.True(summary.Deadline.Value > DateTime.UtcNow);
        Assert.Equal("AUN-QA 2024", summary.StandardSetName);
        Assert.Equal(1, summary.ChartType);
        Assert.Equal(4.0, summary.Stats.AvgScore, 1);
        Assert.Equal(1, summary.Stats.EvidenceCount);
        Assert.Equal(3, summary.Stats.CriteriaEvaluated);
        Assert.Equal(3, summary.Stats.CriteriaTotal);
        Assert.Equal(100, summary.Stats.ProgressPercent);
        Assert.Equal(new[] { "Nhan su", "Chuong trinh" }, summary.TopCriteria.Select(x => x.Name));
        Assert.Equal(new[] { "Minh chung", "Chuong trinh" }, summary.BottomCriteria.Select(x => x.Name));
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

    private static void SeedEvidenceMap(BusinessContext context, Guid cycleId, bool isDeleted)
    {
        context.EvidenceCycleMaps.Add(new EvidenceCycleMap
        {
            Id = Guid.NewGuid(),
            EvidenceId = Guid.NewGuid(),
            CycleId = cycleId,
            ReviewStatus = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = isDeleted
        });
    }

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
