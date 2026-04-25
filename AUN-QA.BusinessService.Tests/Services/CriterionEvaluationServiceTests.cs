using System.Security.Claims;
using System.Text.Json;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation;
using AUN_QA.Shared.Exceptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;

namespace AUN_QA.BusinessService.Tests;

public class CriterionEvaluationServiceTests
{
    [Fact]
    public async Task Submit_InDoPhase_AllowsEmptyToWaiting()
    {
        await using var context = CreateContext();
        var (service, userId, standardId, cycleId) = CreateService(context, CycleStatus.Do, null);

        var evaluationId = Guid.NewGuid();
        context.CriterionEvaluations.Add(new Entities.CriterionEvaluation
        {
            Id = evaluationId,
            CycleId = cycleId,
            CriterionId = Guid.NewGuid(),
            StandardId = standardId,
            Status = (int)CriterionEvaluationStatus.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        var request = new EvaluationSubmissionRequest
        {
            CriterionEvaluationId = evaluationId,
            CurrentState = "  Trạng thái thực tế  ",
            Strengths = "  Điểm mạnh  ",
            Weaknesses = "  Điểm tồn tại  ",
            ActionPlan = "  Kế hoạch  ",
            ProposedScore = 5,
            ProposedResult = null
        };

        await service.Submit(request);

        var updatedEvaluation = await context.CriterionEvaluations.SingleAsync(x => x.Id == evaluationId);
        var submission = await context.EvaluationSubmissions.SingleAsync(x => x.CriterionEvaluationId == evaluationId);

        Assert.Equal((int)CriterionEvaluationStatus.Waiting, updatedEvaluation.Status);
        Assert.Equal("Trạng thái thực tế", submission.CurrentState);
        Assert.Equal("Điểm mạnh", submission.Strengths);
        Assert.Equal("Điểm tồn tại", submission.Weaknesses);
        Assert.Equal("Kế hoạch", submission.ActionPlan);
    }

    [Fact]
    public async Task Submit_InRevisionPhase_AllowsApprovedToWaiting()
    {
        await using var context = CreateContext();
        var (service, userId, standardId, cycleId) = CreateService(context, CycleStatus.Check, SarStatus.RevisionRequested);

        var evaluationId = Guid.NewGuid();
        context.CriterionEvaluations.Add(new Entities.CriterionEvaluation
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

        var request = new EvaluationSubmissionRequest
        {
            CriterionEvaluationId = evaluationId,
            CurrentState = "Updated state",
            Strengths = "Updated strengths",
            Weaknesses = "Updated weaknesses",
            ActionPlan = "Updated action plan",
            ProposedScore = 6,
            ProposedResult = null
        };

        await service.Submit(request);

        var updatedEvaluation = await context.CriterionEvaluations.SingleAsync(x => x.Id == evaluationId);
        var submission = await context.EvaluationSubmissions.SingleAsync(x => x.CriterionEvaluationId == evaluationId);

        Assert.Equal((int)CriterionEvaluationStatus.Waiting, updatedEvaluation.Status);
        Assert.Equal(5, updatedEvaluation.OfficialScore);
        Assert.True(updatedEvaluation.OfficialResult);
        Assert.Equal("Official state", updatedEvaluation.OfficialCurrentState);
        Assert.Equal("Updated state", submission.CurrentState);
    }

    [Fact]
    public async Task Submit_InCheckPhaseWithoutRevision_RejectsApprovedEvaluation()
    {
        await using var context = CreateContext();
        var (service, userId, standardId, cycleId) = CreateService(context, CycleStatus.Check, SarStatus.Submitted);

        var evaluationId = Guid.NewGuid();
        context.CriterionEvaluations.Add(new Entities.CriterionEvaluation
        {
            Id = evaluationId,
            CycleId = cycleId,
            CriterionId = Guid.NewGuid(),
            StandardId = standardId,
            Status = (int)CriterionEvaluationStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        var request = new EvaluationSubmissionRequest
        {
            CriterionEvaluationId = evaluationId,
            CurrentState = "State",
            Strengths = "Strengths",
            Weaknesses = "Weaknesses",
            ActionPlan = "Action plan"
        };

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.Submit(request));

        Assert.Contains("phiếu đánh giá ở pha DO hoặc khi SAR yêu cầu chỉnh sửa", ex.Message);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static (
        CriterionEvaluationService Service,
        Guid UserId,
        Guid StandardId,
        Guid CycleId) CreateService(
        BusinessContext context,
        CycleStatus cycleStatus,
        SarStatus? sarStatus)
    {
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var standardId = Guid.NewGuid();

        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim("name", userId.ToString()),
                    },
                    "TestAuth",
                    nameType: JwtRegisteredClaimNames.Sub,
                    roleType: ClaimTypes.Role))
            }
        };

        if (sarStatus.HasValue)
        {
            context.SarReports.Add(new Entities.SarReport
            {
                Id = Guid.NewGuid(),
                CycleId = cycleId,
                Status = (int)sarStatus.Value,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "system",
                IsActived = true,
                IsDeleted = false
            });
        }

        context.Cycles.Add(CreateCycle(cycleId, cycleStatus));
        context.Councils.Add(CreateEvaluatorCouncil(cycleId, userId, standardId));
        context.SaveChanges();

        return (
            new CriterionEvaluationService(
            context,
            accessor,
            null!,
            null!,
            null!),
            userId,
            standardId,
            cycleId);
    }

    private static Entities.Cycle CreateCycle(Guid cycleId, CycleStatus cycleStatus)
    {
        return new Entities.Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = (int)cycleStatus,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        };
    }

    private static Entities.Council CreateEvaluatorCouncil(Guid cycleId, Guid userId, Guid standardId)
    {
        return new Entities.Council
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
        };
    }
}
