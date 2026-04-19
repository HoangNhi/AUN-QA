using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;
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

public class ActionPlanUpdateTaskCouncilRoleTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public async Task UpdateTaskByCouncil_allows_head_and_deputy_head_roles(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, planId, taskId) = SeedPlanWithTask(context, status: (int)ActionPlanStatus.InProgress);
        SeedCouncil(context, cycleId, userId, roleId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId, "council-user");

        var result = await service.UpdateTaskByCouncil(new ActionPlanUpdateTaskRequest
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Nội dung mới",
            Note = "Ghi chú",
            TaskStatus = (int)ActionTaskStatus.Done,
            DueDate = DateTime.UtcNow.AddDays(3)
        });

        Assert.Equal(taskId, result.Id);
        Assert.Equal("Nội dung mới", result.Description);
        Assert.Equal((int)ActionTaskStatus.Done, result.TaskStatus);

        var updatedTask = await context.ActionTasks.FirstAsync(x => x.Id == taskId);
        Assert.Equal("Nội dung mới", updatedTask.Description);
        Assert.Equal((int)ActionTaskStatus.Done, updatedTask.TaskStatus);
        Assert.NotNull(updatedTask.CompletedAt);
    }

    [Theory]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task UpdateTaskByCouncil_rejects_non_leadership_roles(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, planId, taskId) = SeedPlanWithTask(context, status: (int)ActionPlanStatus.InProgress);
        SeedCouncil(context, cycleId, userId, roleId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId, "council-user");

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.UpdateTaskByCouncil(new ActionPlanUpdateTaskRequest
            {
                Id = taskId,
                ActionPlanId = planId,
                Description = "Nội dung mới",
                TaskStatus = (int)ActionTaskStatus.InProgress
            }));

        Assert.Contains("CTH/PCT", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new BusinessContext(options);
    }

    private static (Guid cycleId, Guid planId, Guid taskId) SeedPlanWithTask(
        BusinessContext context,
        int status)
    {
        var cycleId = Guid.NewGuid();
        var planId = Guid.NewGuid();
        var taskId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle ACT",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = (int)CycleStatus.Act,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.ActionPlans.Add(new ActionPlan
        {
            Id = planId,
            CycleId = cycleId,
            Title = "Kế hoạch",
            Priority = (int)ActionPriority.Medium,
            Deadline = DateTime.UtcNow.AddDays(7),
            Status = status,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "tester",
            IsActived = true,
            IsDeleted = false
        });

        context.ActionTasks.Add(new ActionTask
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Công việc cũ",
            TaskStatus = (int)ActionTaskStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "tester",
            IsActived = true,
            IsDeleted = false
        });

        return (cycleId, planId, taskId);
    }

    private static void SeedCouncil(BusinessContext context, Guid cycleId, Guid userId, int roleId)
    {
        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = roleId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static ActionPlanService CreateServiceForUser(
        BusinessContext context,
        Guid userId,
        string username)
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

        var uploadService = Substitute.For<IUploadFileService>();
        uploadService.UploadDataAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(new List<AUN_QA.Shared.DTOs.Base.ModelAttachment>()));
        uploadService.DeleteDataAsync(Arg.Any<List<string>>())
            .Returns(Task.FromResult(true));

        return new ActionPlanService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()),
            uploadService,
            new Mapper(new MapperConfiguration(cfg => cfg.AddProfile(new ActionPlanProfile()), NullLoggerFactory.Instance)),
            Substitute.For<ICatalogIntegrationService>());
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request) => throw new NotSupportedException();

        public override TResponse BlockingUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request) => throw new NotSupportedException();

        public override AsyncClientStreamingCall<TRequest, TResponse> AsyncClientStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options) => throw new NotSupportedException();

        public override AsyncServerStreamingCall<TResponse> AsyncServerStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request) => throw new NotSupportedException();

        public override AsyncDuplexStreamingCall<TRequest, TResponse> AsyncDuplexStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options) => throw new NotSupportedException();
    }
}
