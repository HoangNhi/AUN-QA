using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace AUN_QA.BusinessService.Tests;

public class CycleServiceDoTransitionTests
{
    [Fact]
    public async Task ChangeStatusAsync_PlanToDo_CreatesCriterionEvaluations()
    {
        await using var context = CreateContext();
        var standardId = Guid.NewGuid();
        var criterion1Id = Guid.NewGuid();
        var criterion2Id = Guid.NewGuid();

        var catalogService = Substitute.For<ICatalogIntegrationService>();
        catalogService
            .GetStandardsWithCriteriaStreamAsync(Arg.Any<GetStandardsWithCriteriaStreamRequest>())
            .Returns(StreamCriteria(new[]
            {
                new StandardWithCriteriaDto
                {
                    StandardId = standardId,
                    CriterionId = criterion1Id,
                    CriterionCode = "C1.1",
                    CriterionName = "Criterion 1"
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardId,
                    CriterionId = criterion2Id,
                    CriterionCode = "C1.2",
                    CriterionName = "Criterion 2"
                }
            }));

        var (service, cycleId, _) = CreateService(context, catalogService, CycleStatus.Plan);

        await service.ChangeStatusAsync(new CycleChangeStatusRequest { Id = cycleId });

        var evaluations = await context.CriterionEvaluations
            .Where(x => x.CycleId == cycleId && !x.IsDeleted)
            .ToListAsync();

        Assert.Equal(2, evaluations.Count);
        Assert.Contains(evaluations, e => e.CriterionId == criterion1Id);
        Assert.Contains(evaluations, e => e.CriterionId == criterion2Id);
        Assert.All(evaluations, e => Assert.Equal((int)CriterionEvaluationStatus.Empty, e.Status));
        Assert.All(evaluations, e => Assert.True(e.IsActived));
    }

    [Fact]
    public async Task ChangeStatusAsync_PlanToDo_EnsuresSarReportExists()
    {
        await using var context = CreateContext();
        var catalogService = Substitute.For<ICatalogIntegrationService>();
        catalogService
            .GetStandardsWithCriteriaStreamAsync(Arg.Any<GetStandardsWithCriteriaStreamRequest>())
            .Returns(StreamCriteria(new[]
            {
                new StandardWithCriteriaDto
                {
                    StandardId = Guid.NewGuid(),
                    CriterionId = Guid.NewGuid(),
                    CriterionCode = "C1.1",
                    CriterionName = "Criterion 1"
                }
            }));

        var (service, cycleId, _) = CreateService(context, catalogService, CycleStatus.Plan);

        await service.ChangeStatusAsync(new CycleChangeStatusRequest { Id = cycleId });

        var sarReport = await context.SarReports
            .Where(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived)
            .SingleOrDefaultAsync();

        Assert.NotNull(sarReport);
        Assert.Equal((int)SarStatus.Draft, sarReport!.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_PlanToDo_DoesNotOverwriteExistingEvaluations()
    {
        await using var context = CreateContext();
        var standardId = Guid.NewGuid();
        var existingCriterionId = Guid.NewGuid();
        var newCriterionId = Guid.NewGuid();

        var catalogService = Substitute.For<ICatalogIntegrationService>();
        catalogService
            .GetStandardsWithCriteriaStreamAsync(Arg.Any<GetStandardsWithCriteriaStreamRequest>())
            .Returns(StreamCriteria(new[]
            {
                new StandardWithCriteriaDto
                {
                    StandardId = standardId,
                    CriterionId = existingCriterionId,
                    CriterionCode = "C1.1",
                    CriterionName = "Criterion 1"
                },
                new StandardWithCriteriaDto
                {
                    StandardId = standardId,
                    CriterionId = newCriterionId,
                    CriterionCode = "C1.2",
                    CriterionName = "Criterion 2"
                }
            }));

        var (service, cycleId, _) = CreateService(context, catalogService, CycleStatus.Plan);

        context.CriterionEvaluations.Add(new CriterionEvaluation
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            CriterionId = existingCriterionId,
            StandardId = standardId,
            Status = (int)CriterionEvaluationStatus.Waiting,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        await service.ChangeStatusAsync(new CycleChangeStatusRequest { Id = cycleId });

        var evaluations = await context.CriterionEvaluations
            .Where(x => x.CycleId == cycleId && !x.IsDeleted)
            .ToListAsync();

        Assert.Equal(2, evaluations.Count);
        var existingEval = evaluations.Single(e => e.CriterionId == existingCriterionId);
        Assert.Equal((int)CriterionEvaluationStatus.Waiting, existingEval.Status);
    }

    [Fact]
    public async Task ChangeStatusAsync_DoToCheck_DoesNotCreateEvaluations()
    {
        await using var context = CreateContext();
        var catalogService = Substitute.For<ICatalogIntegrationService>();

        var (service, cycleId, _) = CreateService(context, catalogService, CycleStatus.Do);

        await service.ChangeStatusAsync(new CycleChangeStatusRequest { Id = cycleId });

        catalogService.DidNotReceive().GetStandardsWithCriteriaStreamAsync(
            Arg.Any<GetStandardsWithCriteriaStreamRequest>());

        var evaluations = await context.CriterionEvaluations
            .Where(x => x.CycleId == cycleId && !x.IsDeleted)
            .ToListAsync();

        Assert.Empty(evaluations);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static (CycleService Service, Guid CycleId, Guid UserId) CreateService(
        BusinessContext context,
        ICatalogIntegrationService catalogService,
        CycleStatus initialStatus = CycleStatus.Plan)
    {
        var userId = Guid.NewGuid();
        var standardSetId = Guid.NewGuid();
        var cycleId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Test Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddYears(1),
            Status = (int)initialStatus,
            StandardSetId = standardSetId,
            EvaluationPurpose = "Test",
            Scope = 1,
            CreatedBy = "testuser",
            CreatedAt = DateTime.UtcNow,
            IsActived = true,
            IsDeleted = false
        });

        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = (int)CouncilRole.HeadOfCouncil,
            CreatedBy = "system",
            CreatedAt = DateTime.UtcNow,
            IsActived = true,
            IsDeleted = false
        });

        context.SaveChanges();

        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim("name", userId.ToString()),
                    new Claim(ClaimTypes.Name, "testuser")
                },
                authenticationType: "TestAuth",
                nameType: ClaimTypes.Name,
                roleType: ClaimTypes.Role))
        };

        var service = new CycleService(
            context,
            Substitute.For<IMapper>(),
            new HttpContextAccessor { HttpContext = httpContext },
            catalogService);

        return (service, cycleId, userId);
    }

    private static async IAsyncEnumerable<StandardWithCriteriaDto> StreamCriteria(
        IEnumerable<StandardWithCriteriaDto> items)
    {
        foreach (var item in items)
        {
            await Task.Yield();
            yield return item;
        }
    }
}
