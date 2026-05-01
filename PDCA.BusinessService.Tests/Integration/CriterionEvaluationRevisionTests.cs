using System.Security.Claims;
using System.Text.Json;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation;
using AUN_QA.Shared.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace AUN_QA.BusinessService.Tests.Integration;

public class CriterionEvaluationRevisionTests
{
    [Fact]
    public async Task RevisionWorkflow_ApprovedEvaluationUpdated_StatusResetsToWaiting()
    {
        await using var context = CreateContext();
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var standardId = Guid.NewGuid();
        var evaluationId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = (int)CycleStatus.Check,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        context.SarReports.Add(new SarReport
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            Status = (int)SarStatus.RevisionRequested,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = (int)CouncilRole.Evaluator,
            AssignedStandards = JsonSerializer.Serialize(new[] { standardId }),
            IsDelegated = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        context.CriterionEvaluations.Add(new CriterionEvaluation
        {
            Id = evaluationId,
            CycleId = cycleId,
            CriterionId = Guid.NewGuid(),
            StandardId = standardId,
            Status = (int)CriterionEvaluationStatus.Approved,
            OfficialScore = 5,
            OfficialResult = true,
            OfficialCurrentState = "Official state",
            OfficialStrengths = "Official strengths",
            OfficialWeaknesses = "Official weaknesses",
            OfficialActionPlan = "Official action plan",
            ApprovedBy = "CTH",
            ApprovedAt = DateTime.UtcNow.AddDays(-1),
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim("name", userId.ToString()) },
                    "TestAuth",
                    nameType: JwtRegisteredClaimNames.Sub,
                    roleType: ClaimTypes.Role))
            }
        };

        var service = new CriterionEvaluationService(context, accessor, null!, null!, null!);
        await service.Submit(new EvaluationSubmissionRequest
        {
            CriterionEvaluationId = evaluationId,
            CurrentState = "Updated state after feedback",
            Strengths = "Updated strengths",
            Weaknesses = "Updated weaknesses",
            ActionPlan = "Updated action plan",
            ProposedScore = 6
        });

        var updatedEvaluation = await context.CriterionEvaluations.SingleAsync(x => x.Id == evaluationId);
        var submission = await context.EvaluationSubmissions.SingleAsync(x => x.CriterionEvaluationId == evaluationId);

        Assert.Equal((int)CriterionEvaluationStatus.Waiting, updatedEvaluation.Status);
        Assert.Equal(5, updatedEvaluation.OfficialScore);
        Assert.True(updatedEvaluation.OfficialResult);
        Assert.Equal("Updated state after feedback", submission.CurrentState);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }
}
