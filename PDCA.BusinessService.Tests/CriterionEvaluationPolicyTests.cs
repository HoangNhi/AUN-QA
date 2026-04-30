using System.Text.Json;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation;

namespace AUN_QA.BusinessService.Tests;

public class CriterionEvaluationPolicyTests
{
    [Fact]
    public void CanTvhSubmit_false_when_no_assignment()
    {
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var standardId = Guid.NewGuid();
        var councils = new[]
        {
            new Council
            {
                CycleId = cycleId,
                UserId = userId,
                RoleId = (int)CouncilRole.Evaluator,
                AssignedStandards = JsonSerializer.Serialize(Array.Empty<Guid>()),
                IsActived = true,
                IsDeleted = false
            }
        };

        var allowed = CriterionEvaluationPolicy.CanTvhSubmit(cycleId, userId, standardId, councils);

        Assert.False(allowed);
    }

    [Fact]
    public void CanTvhSubmit_true_when_user_is_tvh_and_standard_is_in_scope()
    {
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var standardId = Guid.NewGuid();
        var councils = new[]
        {
            new Council
            {
                CycleId = cycleId,
                UserId = userId,
                RoleId = (int)CouncilRole.Evaluator,
                AssignedStandards = JsonSerializer.Serialize(new[] { standardId }),
                IsActived = true,
                IsDeleted = false
            }
        };

        var allowed = CriterionEvaluationPolicy.CanTvhSubmit(cycleId, userId, standardId, councils);

        Assert.True(allowed);
    }

    [Fact]
    public void CanTvhSubmit_false_when_user_is_out_of_scope_or_not_tvh()
    {
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var standardId = Guid.NewGuid();
        var councils = new[]
        {
            new Council
            {
                CycleId = cycleId,
                UserId = userId,
                RoleId = (int)CouncilRole.Secretary,
                AssignedStandards = JsonSerializer.Serialize(new[] { standardId }),
                IsActived = true,
                IsDeleted = false
            },
            new Council
            {
                CycleId = cycleId,
                UserId = userId,
                RoleId = (int)CouncilRole.Evaluator,
                AssignedStandards = JsonSerializer.Serialize(new[] { Guid.NewGuid() }),
                IsActived = true,
                IsDeleted = false
            }
        };

        var allowed = CriterionEvaluationPolicy.CanTvhSubmit(cycleId, userId, standardId, councils);

        Assert.False(allowed);
    }

    [Fact]
    public void CalculateRoundedAunScore_rounds_midpoints_away_from_zero()
    {
        var roundedScore = CriterionEvaluationPolicy.CalculateRoundedAunScore(new int?[] { 4, 5 });

        Assert.Equal(5, roundedScore);
    }
}
