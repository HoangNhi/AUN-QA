using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;
using AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;
using AUN_QA.BusinessService.Services.Integration.Catalog;
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

public class ActionPlanWorkflowTests
{
    [Fact]
    public async Task Insert_non_act_cycle_throws_business_exception()
    {
        await using var context = CreateContext();
        var cycleId = SeedCycle(context, (int)CycleStatus.Check);
        var service = CreateActionPlanService(context, userId: null, username: "admin");

        var ex = await Assert.ThrowsAsync<BusinessException>(() => service.Insert(new ActionPlanUpsertRequest
        {
            CycleId = cycleId,
            Title = "Kế hoạch thử nghiệm",
            Deadline = DateTime.UtcNow.AddDays(7),
            Status = (int)ActionPlanStatus.Draft
        }));

        Assert.Contains("ACT", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Insert_act_cycle_persists_plan_in_draft_status()
    {
        await using var context = CreateContext();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var service = CreateActionPlanService(context, userId: null, username: "admin");

        var result = await service.Insert(new ActionPlanUpsertRequest
        {
            CycleId = cycleId,
            Title = "Kế hoạch thử nghiệm",
            Deadline = DateTime.UtcNow.AddDays(7),
            Status = (int)ActionPlanStatus.Draft
        });

        Assert.Equal((int)ActionPlanStatus.Draft, result.Status);
        Assert.Equal("Kế hoạch thử nghiệm", result.Title);
    }

    [Fact]
    public async Task UpdateTask_when_all_tasks_done_auto_moves_to_pending_review()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = Guid.NewGuid();

        context.ActionPlans.Add(new ActionPlan
        {
            Id = planId,
            CycleId = cycleId,
            Title = "Kế hoạch",
            Priority = 2,
            Deadline = DateTime.UtcNow.AddDays(7),
            Status = (int)ActionPlanStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "tester",
            IsActived = true,
            IsDeleted = false
        });

        context.ActionPlanAssignees.Add(new ActionPlanAssignee
        {
            Id = Guid.NewGuid(),
            ActionPlanId = planId,
            UserId = userId,
            AssignedAt = DateTime.UtcNow,
            AssignedBy = "tester",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "tester",
            IsActived = true,
            IsDeleted = false
        });

        var taskId = Guid.NewGuid();
        context.ActionTasks.Add(new ActionTask
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Task",
            TaskStatus = (int)ActionTaskStatus.Todo,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "tester",
            IsActived = true,
            IsDeleted = false
        });

        await context.SaveChangesAsync();

        var service = CreateTaskExecutionService(context, userId, "tester");
        await service.UpdateTask(new TaskExecutionUpsertTaskRequest
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Task",
            Note = null,
            TaskStatus = (int)ActionTaskStatus.Done,
            DueDate = DateTime.UtcNow.AddDays(1)
        });

        var updatedPlan = await context.ActionPlans.FirstAsync(x => x.Id == planId);
        Assert.Equal((int)ActionPlanStatus.PendingReview, updatedPlan.Status);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
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

    private static ActionPlanService CreateActionPlanService(BusinessContext context, Guid? userId, string username)
    {
        var claims = BuildClaims(userId, username);
        var accessor = CreateHttpContextAccessor(claims);
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
            Substitute.For<ICatalogIntegrationService>());
    }

    private static TaskExecutionService CreateTaskExecutionService(BusinessContext context, Guid? userId, string username)
    {
        var claims = BuildClaims(userId, username);
        var accessor = CreateHttpContextAccessor(claims);
        var uploadService = Substitute.For<IUploadFileService>();
        var actionPlanService = Substitute.For<IActionPlanService>();

        return new TaskExecutionService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()),
            uploadService,
            actionPlanService);
    }

    private static List<Claim> BuildClaims(Guid? userId, string username)
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

        return claims;
    }

    private static HttpContextAccessor CreateHttpContextAccessor(List<Claim> claims)
    {
        return new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };
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
