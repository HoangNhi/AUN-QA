using System.Reflection;
using AUN_QA.BusinessService.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanControllerUpdateTaskRouteTests
{
    [Fact]
    public void ActionPlanController_exposes_update_task_route()
    {
        var method = typeof(ActionPlanController).GetMethod(
            "UpdateTask",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        var route = method!
            .GetCustomAttributes(typeof(HttpPutAttribute), inherit: true)
            .Cast<HttpPutAttribute>()
            .Single();

        Assert.Equal("update-task", route.Template);
    }
}
