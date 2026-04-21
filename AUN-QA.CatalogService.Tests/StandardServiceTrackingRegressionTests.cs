using System.Security.Claims;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.CriterionRequirement.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;
using AUN_QA.CatalogService.Entities;
using AUN_QA.CatalogService.Services.CoreFeature.Standard;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace AUN_QA.CatalogService.Tests;

public class StandardServiceTrackingRegressionTests
{
    [Fact]
    public async Task Insert_with_nested_requirements_persists_without_duplicate_tracking()
    {
        await using var context = new TestCatalogContext();
        var service = CreateService(context);

        var standardId = Guid.NewGuid();
        var criterionId = Guid.NewGuid();

        var request = new StandardRequest
        {
            Id = standardId,
            StandardSetId = Guid.NewGuid(),
            Code = "STD-01",
            Name = "Standard 01",
            Order = 1,
            Criterions =
            [
                new CriterionRequest
                {
                    Id = criterionId,
                    StandardId = standardId,
                    Code = "1.1",
                    Name = "Criterion 1",
                    Order = 1,
                    IsPrerequisite = true,
                    CriterionRequirements =
                    [
                        new CriterionRequirementRequest
                        {
                            Id = Guid.NewGuid(),
                            CriterionId = criterionId,
                            FileTypeId = Guid.NewGuid(),
                            IsMandatory = true,
                            MinQuantity = 1
                        },
                        new CriterionRequirementRequest
                        {
                            Id = Guid.NewGuid(),
                            CriterionId = criterionId,
                            FileTypeId = Guid.NewGuid(),
                            IsMandatory = true,
                            MinQuantity = 1
                        }
                    ]
                }
            ]
        };

        await service.Insert(request);

        Assert.Equal(1, await context.Standards.CountAsync());
        Assert.Equal(1, await context.Criteria.CountAsync());
        Assert.Equal(2, await context.CriterionRequirements.CountAsync());
    }

    [Fact]
    public async Task Update_with_new_criterion_requirements_persists_without_duplicate_tracking()
    {
        await using var context = new TestCatalogContext();
        var standardId = Guid.NewGuid();
        var standardSetId = Guid.NewGuid();

        context.Standards.Add(new Standard
        {
            Id = standardId,
            StandardSetId = standardSetId,
            Code = "STD-EXIST",
            Name = "Existing Standard",
            Order = 1,
            CreatedBy = "seed",
            CreatedAt = DateTime.UtcNow,
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var criterionId = Guid.NewGuid();

        var request = new StandardRequest
        {
            Id = standardId,
            StandardSetId = standardSetId,
            Code = "STD-EXIST",
            Name = "Existing Standard",
            Order = 1,
            Criterions =
            [
                new CriterionRequest
                {
                    Id = criterionId,
                    StandardId = standardId,
                    Code = "1.1",
                    Name = "Criterion Added In Update",
                    Order = 1,
                    IsPrerequisite = true,
                    CriterionRequirements =
                    [
                        new CriterionRequirementRequest
                        {
                            Id = Guid.NewGuid(),
                            CriterionId = criterionId,
                            FileTypeId = Guid.NewGuid(),
                            IsMandatory = true,
                            MinQuantity = 1
                        }
                    ]
                }
            ]
        };

        await service.Update(request);

        Assert.Equal(1, await context.Criteria.CountAsync(x => !x.IsDeleted));
        Assert.Equal(1, await context.CriterionRequirements.CountAsync(x => !x.IsDeleted));
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
