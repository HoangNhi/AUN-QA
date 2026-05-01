using System.Security.Claims;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;
using AUN_QA.CatalogService.Entities;
using AUN_QA.CatalogService.Services.CoreFeature.Standard;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace AUN_QA.CatalogService.Tests;

public class StandardGetListFilterRegressionTests
{
    [Fact]
    public async Task GetList_filters_by_standard_set_id()
    {
        await using var context = new TestCatalogContext();
        var targetStandardSetId = Guid.NewGuid();
        var otherStandardSetId = Guid.NewGuid();

        context.StandardSets.AddRange(
            new StandardSet
            {
                Id = targetStandardSetId,
                Code = "SS-01",
                Name = "Target Set",
                EvaluationMode = 1,
                IsActived = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "seed"
            },
            new StandardSet
            {
                Id = otherStandardSetId,
                Code = "SS-02",
                Name = "Other Set",
                EvaluationMode = 1,
                IsActived = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "seed"
            });

        context.Standards.AddRange(
            new Standard
            {
                Id = Guid.NewGuid(),
                StandardSetId = targetStandardSetId,
                Code = "STD-01",
                Name = "Target Standard",
                Order = 1,
                IsActived = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "seed"
            },
            new Standard
            {
                Id = Guid.NewGuid(),
                StandardSetId = otherStandardSetId,
                Code = "STD-02",
                Name = "Other Standard",
                Order = 2,
                IsActived = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "seed"
            });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetList(new StandardGetListPagingRequest
        {
            PageIndex = 1,
            PageSize = 10,
            StandardSetId = targetStandardSetId
        });

        Assert.Single(result.Data);
        Assert.Equal(targetStandardSetId, result.Data[0].StandardSetId);
        Assert.Equal("STD-01", result.Data[0].Code);
    }

    [Fact]
    public async Task GetList_filters_by_is_actived()
    {
        await using var context = new TestCatalogContext();
        var standardSetId = Guid.NewGuid();

        context.StandardSets.Add(new StandardSet
        {
            Id = standardSetId,
            Code = "SS-01",
            Name = "Shared Set",
            EvaluationMode = 1,
            IsActived = true,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed"
        });

        context.Standards.AddRange(
            new Standard
            {
                Id = Guid.NewGuid(),
                StandardSetId = standardSetId,
                Code = "STD-01",
                Name = "Active Standard",
                Order = 1,
                IsActived = true,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "seed"
            },
            new Standard
            {
                Id = Guid.NewGuid(),
                StandardSetId = standardSetId,
                Code = "STD-02",
                Name = "Inactive Standard",
                Order = 2,
                IsActived = false,
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "seed"
            });

        await context.SaveChangesAsync();

        var service = CreateService(context);

        var result = await service.GetList(new StandardGetListPagingRequest
        {
            PageIndex = 1,
            PageSize = 10,
            IsActived = true
        });

        Assert.Single(result.Data);
        Assert.All(result.Data, item => Assert.True(item.IsActived));
        Assert.Equal("STD-01", result.Data[0].Code);
    }

    private static StandardService CreateService(TestCatalogContext context)
        => new(context, CreateMapper(), CreateHttpContextAccessor());

    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile(new StandardProfile());
        }, NullLoggerFactory.Instance);

        return config.CreateMapper();
    }

    private static IHttpContextAccessor CreateHttpContextAccessor()
        => new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        [new Claim(ClaimTypes.Name, "test-user")],
                        "TestAuth"))
            }
        };
}
