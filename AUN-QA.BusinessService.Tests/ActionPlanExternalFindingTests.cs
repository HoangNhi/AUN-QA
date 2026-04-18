using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using AutoMapper;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanExternalFindingTests
{
    [Fact]
    public async Task GetExternalReviewFindings_enriches_standard_and_criterion_metadata()
    {
        await using var context = CreateContext();
        var seed = SeedExternalReviewData(context);

        var catalogService = Substitute.For<ICatalogIntegrationService>();
        catalogService
            .GetStandardsWithCriteriaStreamAsync(Arg.Any<GetStandardsWithCriteriaStreamRequest>(), Arg.Any<CancellationToken>())
            .Returns(CreateCatalogRows(seed.StandardId, seed.CriterionId));

        var service = CreateActionPlanService(context, catalogService);

        var result = await service.GetExternalReviewFindings(new ActionPlanExternalFindingRequest
        {
            CycleId = seed.CycleId
        });

        var item = Assert.Single(result);
        Assert.Equal(seed.StandardId, item.StandardId);
        Assert.Equal(seed.CriterionId, item.CriterionId);
        Assert.Equal("STD-01", item.StandardCode);
        Assert.Equal("Tiêu chuẩn 01", item.StandardName);
        Assert.Equal("C1.1", item.CriterionCode);
        Assert.Equal("Tiêu chí 1.1", item.CriterionName);
    }

    [Fact]
    public async Task GetExternalReviewFindings_when_catalog_unavailable_returns_core_fields_without_throwing()
    {
        await using var context = CreateContext();
        var seed = SeedExternalReviewData(context);

        var catalogService = Substitute.For<ICatalogIntegrationService>();
        catalogService
            .GetStandardsWithCriteriaStreamAsync(Arg.Any<GetStandardsWithCriteriaStreamRequest>(), Arg.Any<CancellationToken>())
            .Returns(_ => ThrowingCatalogRows());

        var service = CreateActionPlanService(context, catalogService);

        var result = await service.GetExternalReviewFindings(new ActionPlanExternalFindingRequest
        {
            CycleId = seed.CycleId
        });

        var item = Assert.Single(result);
        Assert.Equal(seed.StandardId, item.StandardId);
        Assert.Equal(seed.CriterionId, item.CriterionId);
        Assert.NotEmpty(item.Content);
        Assert.Null(item.StandardCode);
        Assert.Null(item.StandardName);
        Assert.Null(item.CriterionCode);
        Assert.Null(item.CriterionName);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new BusinessContext(options);
    }

    private static (Guid CycleId, Guid StandardSetId, Guid StandardId, Guid CriterionId) SeedExternalReviewData(BusinessContext context)
    {
        var cycleId = Guid.NewGuid();
        var standardSetId = Guid.NewGuid();
        var externalReviewId = Guid.NewGuid();
        var resultId = Guid.NewGuid();
        var findingId = Guid.NewGuid();
        var standardId = Guid.NewGuid();
        var criterionId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle ACT",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = (int)CycleStatus.Act,
            EvaluationPurpose = "QA",
            Scope = 1,
            StandardSetId = standardSetId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.ExternalReviews.Add(new ExternalReview
        {
            Id = externalReviewId,
            CycleId = cycleId,
            Status = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.ExternalReviewResults.Add(new ExternalReviewResult
        {
            Id = resultId,
            ExternalReviewId = externalReviewId,
            StandardId = standardId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.ExternalReviewFindings.Add(new ExternalReviewFinding
        {
            Id = findingId,
            ExternalReviewResultId = resultId,
            FindingType = 1,
            Content = "Nội dung kiến nghị cần cải tiến",
            CriterionId = criterionId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.SaveChanges();
        return (cycleId, standardSetId, standardId, criterionId);
    }

    private static ActionPlanService CreateActionPlanService(BusinessContext context, ICatalogIntegrationService catalogService)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new List<Claim>
                {
                    new(ClaimTypes.Name, "admin"),
                    new("unique_name", "admin")
                }, "TestAuth"))
            }
        };

        var uploadService = Substitute.For<IUploadFileService>();
        uploadService.UploadDataAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(new List<AUN_QA.Shared.DTOs.Base.ModelAttachment>()));
        uploadService.DeleteDataAsync(Arg.Any<List<string>>())
            .Returns(Task.FromResult(true));

        var mapper = new Mapper(new MapperConfiguration(cfg => cfg.AddProfile(new ActionPlanProfile()), NullLoggerFactory.Instance));

        return new ActionPlanService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()),
            uploadService,
            mapper,
            catalogService);
    }

    private static async IAsyncEnumerable<StandardWithCriteriaDto> CreateCatalogRows(Guid standardId, Guid criterionId)
    {
        yield return new StandardWithCriteriaDto
        {
            StandardId = standardId,
            StandardCode = "STD-01",
            StandardName = "Tiêu chuẩn 01",
            StandardOrder = 1,
            CriterionId = criterionId,
            CriterionCode = "C1.1",
            CriterionName = "Tiêu chí 1.1",
            IsPrerequisite = false,
            CriterionOrder = 1
        };

        await Task.CompletedTask;
    }

    private static async IAsyncEnumerable<StandardWithCriteriaDto> ThrowingCatalogRows()
    {
        await Task.Yield();
        throw new BusinessException("Catalog service unavailable");
        #pragma warning disable CS0162
        yield break;
        #pragma warning restore CS0162
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(Method<TRequest, TResponse> method, string host, CallOptions options, TRequest request)
            => throw new NotSupportedException($"Unexpected gRPC call: {method.Name}");

        public override TResponse BlockingUnaryCall<TRequest, TResponse>(Method<TRequest, TResponse> method, string host, CallOptions options, TRequest request)
            => throw new NotSupportedException();

        public override AsyncClientStreamingCall<TRequest, TResponse> AsyncClientStreamingCall<TRequest, TResponse>(Method<TRequest, TResponse> method, string host, CallOptions options)
            => throw new NotSupportedException();

        public override AsyncServerStreamingCall<TResponse> AsyncServerStreamingCall<TRequest, TResponse>(Method<TRequest, TResponse> method, string host, CallOptions options, TRequest request)
            => throw new NotSupportedException();

        public override AsyncDuplexStreamingCall<TRequest, TResponse> AsyncDuplexStreamingCall<TRequest, TResponse>(Method<TRequest, TResponse> method, string host, CallOptions options)
            => throw new NotSupportedException();
    }
}
