using System.Reflection;
using AUN_QA.BusinessService.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Tests;

public class SarCollabPersistenceRouteTests
{
    [Fact]
    public void SarController_exposes_allow_anonymous_internal_persist_snapshot_route()
    {
        var method = typeof(SarController).GetMethod(
            "PersistSnapshotFromCollab",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        Assert.True(
            method!.GetCustomAttributes(typeof(HttpPostAttribute), inherit: true).Length > 0,
            "Method must have [HttpPost]");

        var route = method
            .GetCustomAttributes(typeof(RouteAttribute), inherit: true)
            .Cast<RouteAttribute>()
            .Single();

        Assert.Equal("internal/persist-snapshot", route.Template);
        Assert.NotNull(method.GetCustomAttribute<AllowAnonymousAttribute>());
    }
}
