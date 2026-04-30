using System.Text.Json;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;

namespace AUN_QA.BusinessService.Tests;

public class SarWorkflowPolicyTests
{
    [Theory]
    [InlineData(1, "save-draft", true)]
    [InlineData(2, "save-draft", false)]
    [InlineData(3, "save-draft", true)]
    [InlineData(4, "save-draft", false)]
    [InlineData(1, "submit", true)]
    [InlineData(3, "submit", true)]
    [InlineData(2, "submit", false)]
    [InlineData(2, "request-revision", true)]
    [InlineData(1, "request-revision", false)]
    [InlineData(2, "approve", true)]
    [InlineData(1, "approve", false)]
    [InlineData(4, "approve", false)]
    public void SarWorkflowPolicy_matches_transition_matrix(int currentStatus, string action, bool expected)
    {
        var result = action switch
        {
            "save-draft" => SarWorkflowPolicy.CanSaveDraft(currentStatus),
            "submit" => SarWorkflowPolicy.CanSubmit(currentStatus),
            "request-revision" => SarWorkflowPolicy.CanRequestRevision(currentStatus),
            "approve" => SarWorkflowPolicy.CanApprove(currentStatus),
            _ => throw new ArgumentOutOfRangeException(nameof(action))
        };

        Assert.Equal(expected, result);
    }

    [Fact]
    public void SarWorkflowPolicy_allows_head_of_council_to_approve()
    {
        var council = new Council
        {
            RoleId = (int)CouncilRole.HeadOfCouncil,
            IsDelegated = false,
            IsActived = true,
            IsDeleted = false
        };

        Assert.True(SarWorkflowPolicy.CanApprove(council));
    }

    [Fact]
    public void SarWorkflowPolicy_allows_vice_chairman_only_with_active_delegation()
    {
        var council = new Council
        {
            RoleId = (int)CouncilRole.ViceChairman,
            IsDelegated = true,
            DelegatedUntil = DateTime.UtcNow.AddHours(2),
            IsActived = true,
            IsDeleted = false
        };

        Assert.True(SarWorkflowPolicy.CanApprove(council));
    }

    [Fact]
    public void SarWorkflowPolicy_rejects_vice_chairman_without_active_delegation()
    {
        var withoutDelegation = new Council
        {
            RoleId = (int)CouncilRole.ViceChairman,
            IsDelegated = false,
            IsActived = true,
            IsDeleted = false
        };

        var expiredDelegation = new Council
        {
            RoleId = (int)CouncilRole.ViceChairman,
            IsDelegated = true,
            DelegatedUntil = DateTime.UtcNow.AddMinutes(-1),
            IsActived = true,
            IsDeleted = false
        };

        Assert.False(SarWorkflowPolicy.CanApprove(withoutDelegation));
        Assert.False(SarWorkflowPolicy.CanApprove(expiredDelegation));
    }

    [Theory]
    [InlineData(null, false)]
    [InlineData("[]", false)]
    [InlineData("[\"12345678-1234-1234-1234-123456789012\"]", true)]
    public void SarWorkflowPolicy_validates_evaluator_scope(string? assignedStandardsJson, bool expected)
    {
        Assert.Equal(expected, SarWorkflowPolicy.HasValidEvaluatorScope(assignedStandardsJson));
    }
}
