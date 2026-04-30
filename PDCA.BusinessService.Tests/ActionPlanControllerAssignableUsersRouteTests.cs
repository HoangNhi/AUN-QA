using System.Reflection;
using AUN_QA.BusinessService.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanControllerAssignableUsersRouteTests
{
    [Fact]
    public void ActionPlanController_exposes_assignable_users_combobox_route()
    {
        var method = typeof(ActionPlanController).GetMethod(
            "GetAssignableUsersCombobox",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        var route = method!
            .GetCustomAttributes(typeof(HttpGetAttribute), inherit: true)
            .Cast<HttpGetAttribute>()
            .Single();

        Assert.Equal("assignable-users-combobox", route.Template);
    }
}
