using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using IActionPlanService = AUN_QA.BusinessService.Services.CoreFeature.ActionPlan.IActionPlanService;

namespace AUN_QA.BusinessService.Tests;

public class TaskExecutionServiceTests
{
    [Fact]
    public async Task DeleteTask_status_done_throws_business_exception()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        var taskId = SeedTask(context, planId, (int)ActionTaskStatus.Done);
        SeedCouncil(context, cycleId, userId);
        context.SaveChanges();

        var service = CreateService(context, userId, "secretary");

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.DeleteTask(new TaskExecutionDeleteTaskRequest { TaskId = taskId }));

        Assert.Contains("chờ thực hiện", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task InsertTask_creates_todo_task_by_default()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        SeedCouncil(context, cycleId, userId);
        context.SaveChanges();

        var service = CreateService(context, userId, "secretary");

        var result = await service.InsertTask(new TaskExecutionUpsertTaskRequest
        {
            ActionPlanId = planId,
            Description = "Xử lý hồ sơ",
            TaskStatus = (int)ActionTaskStatus.Todo
        });

        Assert.Equal((int)ActionTaskStatus.Todo, result.TaskStatus);
        Assert.Equal("Xử lý hồ sơ", result.Description);
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
        return cycleId;
    }

    private static Guid SeedAssignedPlan(BusinessContext context, Guid cycleId)
    {
        var planId = Guid.NewGuid();
        context.ActionPlans.Add(new ActionPlan
        {
            Id = planId,
            CycleId = cycleId,
            Title = "Kế hoạch",
            Priority = (int)ActionPriority.Medium,
            Deadline = DateTime.UtcNow.AddDays(7),
            Kpi = "KPI",
            Status = (int)ActionPlanStatus.Assigned,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "admin",
            IsActived = true,
            IsDeleted = false
        });
        return planId;
    }

    private static Guid SeedTask(BusinessContext context, Guid planId, int status)
    {
        var taskId = Guid.NewGuid();
        context.ActionTasks.Add(new ActionTask
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Công việc mẫu",
            TaskStatus = status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "admin",
            IsActived = true,
            IsDeleted = false
        });
        return taskId;
    }

    private static void SeedCouncil(BusinessContext context, Guid cycleId, Guid userId)
    {
        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = (int)CouncilRole.Secretary,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static TaskExecutionService CreateService(BusinessContext context, Guid userId, string username)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, username),
            new("unique_name", username),
            new("name", userId.ToString())
        };

        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };

        var actionPlanService = Substitute.For<IActionPlanService>();
        actionPlanService.GetById(Arg.Any<Guid>())
            .Returns(Task.FromResult(new AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos.ActionPlanDetailDto
            {
                Id = Guid.NewGuid(),
                CycleId = Guid.NewGuid(),
                Title = "Test",
                Deadline = DateTime.UtcNow,
                Kpi = "KPI",
                Status = (int)ActionPlanStatus.Assigned
            }));

        return new TaskExecutionService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()),
            Substitute.For<AUN_QA.BusinessService.Services.Commons.UploadFile.IUploadFileService>(),
            actionPlanService);
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
