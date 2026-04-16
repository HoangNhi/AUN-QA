using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using ActionPlanServiceImpl = AUN_QA.BusinessService.Services.CoreFeature.ActionPlan.ActionPlanService;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanWorkflowTests
{
    [Fact]
    public async Task Insert_non_act_cycle_throws_business_exception()
    {
        await using var context = CreateContext();
        var cycleId = SeedCycle(context, (int)CycleStatus.Check);
        var service = CreateService(context, userId: null, username: "admin");

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.Insert(new ActionPlanUpsertRequest
        {
            CycleId = cycleId,
            Title = "Kế hoạch thử nghiệm",
            Deadline = DateTime.UtcNow.AddDays(7),
            Kpi = "KPI thử nghiệm"
        }));

        Assert.Contains("ACT", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Insert_act_cycle_persists_plan_in_draft_status()
    {
        await using var context = CreateContext();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var service = CreateService(context, userId: null, username: "admin");

        var result = await service.Insert(new ActionPlanUpsertRequest
        {
            CycleId = cycleId,
            Title = "Kế hoạch thử nghiệm",
            Deadline = DateTime.UtcNow.AddDays(7),
            Kpi = "KPI thử nghiệm"
        });

        Assert.Equal((int)ActionPlanStatus.Draft, result.Status);
        Assert.Equal("Kế hoạch thử nghiệm", result.Title);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static Guid SeedCycle(BusinessContext context, int status)
    {
        var cycleId = Guid.NewGuid();
        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle ACT",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = status,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
        context.SaveChanges();

        return cycleId;
    }

    private static ActionPlanServiceImpl CreateService(BusinessContext context, Guid? userId, string username)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, username),
            new("unique_name", username)
        };

        if (userId.HasValue)
        {
            claims.Add(new Claim("name", userId.Value.ToString()));
        }

        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };

        return new ActionPlanServiceImpl(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()));
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
        {
            throw new NotSupportedException($"Unexpected gRPC call: {method.Name}");
        }

        public override TResponse BlockingUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
            => throw new NotSupportedException();

        public override AsyncClientStreamingCall<TRequest, TResponse> AsyncClientStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options)
            => throw new NotSupportedException();

        public override AsyncServerStreamingCall<TResponse> AsyncServerStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
            => throw new NotSupportedException();

        public override AsyncDuplexStreamingCall<TRequest, TResponse> AsyncDuplexStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options)
            => throw new NotSupportedException();
    }
}
