using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;
using AUN_QA.Shared.Exceptions;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.Protos;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using NSubstitute;
using IActionPlanService = AUN_QA.BusinessService.Services.CoreFeature.ActionPlan.IActionPlanService;

namespace AUN_QA.BusinessService.Tests;

public class TaskExecutionServiceTests
{
    [Fact]
    public async Task DeleteTask_allows_deleting_done_task_and_soft_deletes_it()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        var taskId = SeedTask(context, planId, (int)ActionTaskStatus.Done, "secretary");
        SeedCouncil(context, cycleId, userId);
        context.SaveChanges();

        var service = CreateService(context, userId, "secretary");

        await service.DeleteTask(new TaskExecutionDeleteTaskRequest { TaskId = taskId });

        var deletedTask = await context.ActionTasks.FirstAsync(x => x.Id == taskId);
        Assert.True(deletedTask.IsDeleted);
        Assert.False(deletedTask.IsActived);
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

    [Fact]
    public async Task InsertTask_persists_uploaded_attachment_filesize()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        SeedCouncil(context, cycleId, userId);
        context.SaveChanges();

        var attachmentId = Guid.NewGuid();
        var uploadService = Substitute.For<AUN_QA.BusinessService.Services.Commons.UploadFile.IUploadFileService>();
        uploadService.UploadDataAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>())
            .Returns(Task.FromResult(new List<ModelAttachment>
            {
                new()
                {
                    Id = attachmentId,
                    ReferenceType = 0,
                    RelatedId = Guid.NewGuid(),
                    FileName = "tai-lieu.pdf",
                    FileExtension = ".pdf",
                    FileSize = 4096,
                    FileUrl = "/files/tai-lieu.pdf"
                }
            }));
        uploadService.DeleteDataAsync(Arg.Any<List<string>>())
            .Returns(Task.FromResult(true));

        var service = CreateService(context, userId, "secretary", uploadService: uploadService);

        var result = await service.InsertTask(new TaskExecutionUpsertTaskRequest
        {
            ActionPlanId = planId,
            Description = "Luu tep dinh kem",
            TaskStatus = (int)ActionTaskStatus.InProgress,
            FolderUpload = "temp-folder"
        });

        Assert.Single(result.Attachments);
        Assert.Equal(4096, result.Attachments[0].FileSize);

        var savedAttachment = await context.ActionTaskAttachments.FirstAsync(x => x.Id == attachmentId);
        Assert.Equal(4096, savedAttachment.FileSize);
    }

    [Fact]
    public async Task GetTaskList_returns_attachment_filesize()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        SeedCouncil(context, cycleId, userId);

        var taskId = SeedTask(context, planId, (int)ActionTaskStatus.Done, "alice");
        SeedAttachment(context, taskId, "KhaNang.pdf", 8192);
        context.SaveChanges();

        var service = CreateService(context, userId, "secretary");

        var result = await service.GetTaskList(new TaskExecutionGetTaskListRequest
        {
            ActionPlanId = planId,
            PageIndex = 1,
            PageSize = 10
        });

        Assert.Single(result.Data);
        Assert.Single(result.Data[0].Attachments);
        Assert.Equal(8192, result.Data[0].Attachments[0].FileSize);
    }

    [Fact]
    public void TaskExecutionService_exposes_GetTaskDetail()
    {
        Assert.NotNull(typeof(TaskExecutionService).GetMethod("GetTaskDetail"));
    }

    [Fact]
    public async Task GetTaskList_returns_paged_tasks_with_fullnames_and_done_count()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        SeedCouncil(context, cycleId, userId);

        var firstTaskId = SeedTask(context, planId, (int)ActionTaskStatus.Done, "alice", DateTime.UtcNow.AddMinutes(-3));
        var secondTaskId = SeedTask(context, planId, (int)ActionTaskStatus.InProgress, "bob", DateTime.UtcNow.AddMinutes(-2));
        var thirdTaskId = SeedTask(context, planId, (int)ActionTaskStatus.Done, "bob", DateTime.UtcNow.AddMinutes(-1));
        SeedAttachment(context, thirdTaskId, "KhaNang.pdf");
        context.SaveChanges();

        var fakeInvoker = new FakeCallInvoker
        {
            GetUsersByUsernamesHandler = request =>
            {
                var response = new GetUsersByUsernamesResponse();
                foreach (var username in request.Usernames)
                {
                    response.Users.Add(new UserInfo
                    {
                        Id = Guid.NewGuid().ToString(),
                        Fullname = username == "alice" ? "Nguyễn Alice" : "Trần Bob",
                        Username = username
                    });
                }

                return response;
            }
        };

        var service = CreateService(context, userId, "secretary", fakeInvoker);

        var result = await service.GetTaskList(new TaskExecutionGetTaskListRequest
        {
            ActionPlanId = planId,
            PageIndex = 1,
            PageSize = 2
        });

        dynamic payload = result;
        Assert.Equal(1, (int)payload.PageIndex);
        Assert.Equal(2, (int)payload.PageSize);
        Assert.Equal(3, (int)payload.TotalRow);
        Assert.Equal(2, (int)payload.DoneCount);

        var data = (IEnumerable<TaskExecutionTaskDto>)payload.Data;
        Assert.Equal(2, data.Count());
        Assert.Equal("Trần Bob", data.First().CreatedByFullname);
        Assert.NotEmpty(data.First().Attachments);
        Assert.Contains(data.Select(x => x.Id), id => id == thirdTaskId || id == secondTaskId);
        Assert.DoesNotContain(data.Select(x => x.Id), id => id == firstTaskId);
    }

    [Fact]
    public async Task PreviewTaskAttachment_uses_upload_service_preview()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = SeedCycle(context, (int)CycleStatus.Act);
        var planId = SeedAssignedPlan(context, cycleId);
        SeedCouncil(context, cycleId, userId);

        var attachmentId = Guid.NewGuid();
        var taskId = Guid.NewGuid();
        context.ActionTasks.Add(new ActionTask
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Task",
            TaskStatus = (int)ActionTaskStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "secretary",
            IsActived = true,
            IsDeleted = false
        });
        context.ActionTaskAttachments.Add(new ActionTaskAttachment
        {
            Id = attachmentId,
            ActionTaskId = taskId,
            FileName = "task.pdf",
            FileUrl = "/files/task.pdf",
            UploadedAt = DateTime.UtcNow,
            UploadedBy = "secretary",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "secretary",
            IsActived = true,
            IsDeleted = false
        });
        context.SaveChanges();

        var uploadService = Substitute.For<AUN_QA.BusinessService.Services.Commons.UploadFile.IUploadFileService>();
        uploadService.PreviewFileAsync(
                "/files/task.pdf",
                "internal",
                null,
                25,
                0,
                attachmentId)
            .Returns(Task.FromResult(new ModelFilePreview
            {
                FileContent = new byte[] { 1, 2, 3 },
                ContentType = "application/pdf",
                FileName = "task.pdf"
            }));

        var service = CreateService(context, userId, "secretary", new FakeCallInvoker(), uploadService);

        var method = typeof(TaskExecutionService).GetMethod("PreviewTaskAttachment");
        Assert.NotNull(method);

        var result = await (Task<ModelFilePreview>)method!.Invoke(service, new object[] { attachmentId, "internal" })!;

        Assert.Equal("task.pdf", result.FileName);
        await uploadService.Received(1).PreviewFileAsync(
            "/files/task.pdf",
            "internal",
            null,
            25,
            0,
            attachmentId);
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
            Status = (int)ActionPlanStatus.InProgress,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "admin",
            IsActived = true,
            IsDeleted = false
        });
        return planId;
    }

    private static Guid SeedTask(
        BusinessContext context,
        Guid planId,
        int status,
        string createdBy = "admin",
        DateTime? createdAt = null)
    {
        var taskId = Guid.NewGuid();
        context.ActionTasks.Add(new ActionTask
        {
            Id = taskId,
            ActionPlanId = planId,
            Description = "Công việc mẫu",
            TaskStatus = status,
            CreatedAt = createdAt ?? DateTime.UtcNow,
            CreatedBy = createdBy,
            IsActived = true,
            IsDeleted = false
        });
        return taskId;
    }

    private static void SeedAttachment(BusinessContext context, Guid taskId, string fileName, double fileSize = 0)
    {
        context.ActionTaskAttachments.Add(new ActionTaskAttachment
        {
            Id = Guid.NewGuid(),
            ActionTaskId = taskId,
            FileName = fileName,
            FileUrl = $"/files/{fileName}",
            FileSize = fileSize,
            UploadedAt = DateTime.UtcNow,
            UploadedBy = "tester",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "tester",
            IsActived = true,
            IsDeleted = false
        });
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

    private static TaskExecutionService CreateService(
        BusinessContext context,
        Guid userId,
        string username,
        FakeCallInvoker? fakeInvoker = null,
        AUN_QA.BusinessService.Services.Commons.UploadFile.IUploadFileService? uploadService = null,
        IActionPlanService? actionPlanService = null)
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

        actionPlanService ??= Substitute.For<IActionPlanService>();
        actionPlanService.GetById(Arg.Any<Guid>())
            .Returns(Task.FromResult(new AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos.ActionPlanDetailDto
            {
            Id = Guid.NewGuid(),
            CycleId = Guid.NewGuid(),
            Title = "Test",
            Deadline = DateTime.UtcNow,
            Status = (int)ActionPlanStatus.InProgress
        }));

        return new TaskExecutionService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(fakeInvoker ?? new FakeCallInvoker()),
            uploadService ?? Substitute.For<AUN_QA.BusinessService.Services.Commons.UploadFile.IUploadFileService>(),
            actionPlanService);
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public Func<GetUsersByUsernamesRequest, GetUsersByUsernamesResponse>? GetUsersByUsernamesHandler { get; set; }

        public Func<GetUsersByIdsRequest, GetUsersByIdsResponse>? GetUsersByIdsHandler { get; set; }

        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
        {
            return method.Name switch
            {
                "GetUsersByUsernames" => CreateUnaryCall(
                    (TResponse)(object)(GetUsersByUsernamesHandler?.Invoke((GetUsersByUsernamesRequest)(object)request!) ?? new GetUsersByUsernamesResponse())),
                "GetUsersByIds" => CreateUnaryCall(
                    (TResponse)(object)(GetUsersByIdsHandler?.Invoke((GetUsersByIdsRequest)(object)request!) ?? new GetUsersByIdsResponse())),
                _ => throw new NotSupportedException($"Unexpected gRPC call: {method.Name}")
            };
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

        private static AsyncUnaryCall<TResponse> CreateUnaryCall<TResponse>(TResponse response)
            where TResponse : class
            => new(
                Task.FromResult(response),
                Task.FromResult(new Metadata()),
                () => new Status(StatusCode.OK, string.Empty),
                () => new Metadata(),
                () => { });
    }
}
