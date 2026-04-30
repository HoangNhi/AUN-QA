using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanSchemaContractTests
{
    [Fact]
    public void Model_contains_action_plan_tables()
    {
        using var context = CreateContext();

        Assert.NotNull(context.Model.FindEntityType(typeof(ActionPlan)));
        Assert.NotNull(context.Model.FindEntityType(typeof(ActionPlanAssignee)));
        Assert.NotNull(context.Model.FindEntityType(typeof(ActionPlanAttachment)));
        Assert.NotNull(context.Model.FindEntityType(typeof(ActionTask)));
        Assert.NotNull(context.Model.FindEntityType(typeof(ActionTaskAttachment)));
    }

    [Fact]
    public void ActionPlanAssignee_has_unique_active_index()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(ActionPlanAssignee));

        Assert.NotNull(entity);
        Assert.Contains(entity!.GetIndexes(), x => x.Name == "IX_ActionPlanAssignee_ActionPlanId_UserId_Active");
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }
}
