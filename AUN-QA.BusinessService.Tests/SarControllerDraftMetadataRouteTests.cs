using System.Reflection;
using AUN_QA.BusinessService.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Tests;

public class SarControllerDraftMetadataRouteTests
{
    [Fact]
    public void SarController_exposes_get_draft_metadata_route()
    {
        var method = typeof(SarController).GetMethod(
            "GetDraftMetadata",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        Assert.True(
            method!.GetCustomAttributes(typeof(HttpPostAttribute), inherit: true).Length > 0,
            "Method must have [HttpPost]");

        var route = method
            .GetCustomAttributes(typeof(RouteAttribute), inherit: true)
            .Cast<RouteAttribute>()
            .Single();

        Assert.Equal("get-draft-metadata", route.Template);
    }
}
