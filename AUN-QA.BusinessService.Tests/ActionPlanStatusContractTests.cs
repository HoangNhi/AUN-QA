using AUN_QA.BusinessService.DTOs.Common;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanStatusContractTests
{
    [Fact]
    public void ActionPlanStatus_must_match_design_contract()
    {
        Assert.Equal(1, (int)ActionPlanStatus.Draft);
        Assert.Equal(2, (int)ActionPlanStatus.Submitted);
        Assert.Equal(3, (int)ActionPlanStatus.RevisionRequested);
        Assert.Equal(4, (int)ActionPlanStatus.Approved);
        Assert.Equal(5, (int)ActionPlanStatus.Assigned);
    }

    [Fact]
    public void ActionTaskStatus_must_match_design_contract()
    {
        Assert.Equal(1, (int)ActionTaskStatus.Todo);
        Assert.Equal(2, (int)ActionTaskStatus.InProgress);
        Assert.Equal(3, (int)ActionTaskStatus.Done);
    }
}
