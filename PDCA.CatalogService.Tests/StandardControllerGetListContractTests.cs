using System.Reflection;
using AUN_QA.CatalogService.Controllers;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;

namespace AUN_QA.CatalogService.Tests;

public class StandardControllerGetListContractTests
{
    [Fact]
    public void StandardController_GetList_accepts_standard_get_list_request()
    {
        var method = typeof(StandardController).GetMethod(
            "GetList",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        var parameter = method!.GetParameters().Single();

        Assert.Equal(typeof(StandardGetListPagingRequest), parameter.ParameterType);
    }
}
