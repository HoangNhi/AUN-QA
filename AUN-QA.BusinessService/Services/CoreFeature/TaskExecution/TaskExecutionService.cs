using System.IdentityModel.Tokens.Jwt;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;
using AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;
using ActionPlanEntity = AUN_QA.BusinessService.Entities.ActionPlan;
using ActionTaskEntity = AUN_QA.BusinessService.Entities.ActionTask;
using ActionTaskAttachmentEntity = AUN_QA.BusinessService.Entities.ActionTaskAttachment;

namespace AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;

[RegisterClassAsTransient]
public class TaskExecutionService : ITaskExecutionService
{
    private readonly BusinessContext _context;
    private readonly IHttpContextAccessor _contextAccessor;
    private readonly SystemProto.SystemProtoClient _systemClient;
    private readonly IUploadFileService _uploadFileService;
    private readonly IActionPlanService _actionPlanService;

    public TaskExecutionService(
        BusinessContext context,
        IHttpContextAccessor contextAccessor,
        SystemProto.SystemProtoClient systemClient,
        IUploadFileService uploadFileService,
        IActionPlanService actionPlanService)
    {
        _context = context;
        _contextAccessor = contextAccessor;
        _systemClient = systemClient;
        _uploadFileService = uploadFileService;
        _actionPlanService = actionPlanService;
    }

    public async Task<GetListPagingResponse<TaskExecutionPlanListItemDto>> GetMyPlans(TaskExecutionGetPlansRequest request)
    {
        var userId = GetCurrentUserIdOrNull();
        if (userId == null)
        {
            return EmptyList(request);
        }

        var query = BuildAssignedPlanQuery()
            .Where(x => _context.ActionPlanAssignees.Any(a =>
                a.ActionPlanId == x.Id &&
                a.UserId == userId.Value &&
                !a.IsDeleted &&
                a.IsActived));

        return await BuildPlanListResponseAsync(query, request);
    }

    public Task<ActionPlanDetailDto> GetPlanDetail(Guid actionPlanId)
    {
        return _actionPlanService.GetById(actionPlanId);
    }

    public async Task<List<TaskExecutionTaskDto>> GetTaskList(TaskExecutionGetTaskListRequest request)
    {
        var detail = await _actionPlanService.GetById(request.ActionPlanId);
        return detail.Tasks
            .Select(x => new TaskExecutionTaskDto
            {
                Id = x.Id,
                ActionPlanId = x.ActionPlanId,
                Description = x.Description,
                Note = x.Note,
                TaskStatus = x.TaskStatus,
                DueDate = x.DueDate,
                CompletedAt = x.CompletedAt,
                CreatedBy = x.CreatedBy,
                Attachments = x.Attachments
                    .Select(a => new TaskExecutionAttachmentDto
                    {
                        Id = a.Id,
                        ActionTaskId = a.ActionTaskId,
                        AttachmentId = a.AttachmentId,
                        FileName = a.FileName,
                        FileUrl = a.FileUrl,
                        UploadedAt = a.UploadedAt,
                        UploadedBy = a.UploadedBy
                    })
                    .ToList()
            })
            .ToList();
    }

    public async Task<TaskExecutionTaskDto> InsertTask(TaskExecutionUpsertTaskRequest request)
    {
        var plan = await GetEditablePlanAsync(request.ActionPlanId);

        var now = DateTime.UtcNow;
        var username = GetCurrentUsernameOrFallback();

        var task = new ActionTaskEntity
        {
            Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id,
            ActionPlanId = plan.Id,
            Description = request.Description.Trim(),
            Note = NormalizeText(request.Note),
            TaskStatus = NormalizeTaskStatus(request.TaskStatus),
            DueDate = request.DueDate,
            CompletedAt = request.TaskStatus == (int)ActionTaskStatus.Done ? now : null,
            CreatedAt = now,
            CreatedBy = username,
            IsActived = true,
            IsDeleted = false
        };

        await _context.ActionTasks.AddAsync(task);
        await _context.SaveChangesAsync();

        return await MapTaskDtoAsync(task.Id);
    }

    public async Task<TaskExecutionTaskDto> UpdateTask(TaskExecutionUpsertTaskRequest request)
    {
        var task = await _context.ActionTasks
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted && x.IsActived);

        if (task == null)
        {
            throw new BusinessException("KhÃ´ng tÃ¬m tháº¥y cÃ´ng viá»‡c");
        }

        await GetEditablePlanAsync(task.ActionPlanId);

        var username = GetCurrentUsernameOrFallback();
        if (!IsAdmin() && !string.Equals(task.CreatedBy, username, StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessException("Bạn không có quyền cập nhật công việc của người khác");
        }

        task.Description = request.Description.Trim();
        task.Note = NormalizeText(request.Note);
        task.TaskStatus = NormalizeTaskStatus(request.TaskStatus);
        task.DueDate = request.DueDate;
        task.CompletedAt = task.TaskStatus == (int)ActionTaskStatus.Done
            ? (task.CompletedAt ?? DateTime.UtcNow)
            : null;
        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = GetCurrentUsernameOrFallback();

        _context.ActionTasks.Update(task);
        await _context.SaveChangesAsync();

        if (task.TaskStatus == (int)ActionTaskStatus.Done)
        {
            var hasIncomplete = await _context.ActionTasks
                .AnyAsync(t => t.ActionPlanId == task.ActionPlanId
                    && !t.IsDeleted
                    && t.IsActived
                    && t.TaskStatus != (int)ActionTaskStatus.Done);

            if (!hasIncomplete)
            {
                var plan = await _context.ActionPlans
                    .FirstOrDefaultAsync(p => p.Id == task.ActionPlanId && !p.IsDeleted && p.IsActived);

                if (plan != null && plan.Status == (int)ActionPlanStatus.InProgress)
                {
                    plan.Status = (int)ActionPlanStatus.PendingReview;
                    plan.UpdatedAt = DateTime.UtcNow;
                    plan.UpdatedBy = GetCurrentUsernameOrFallback();
                    await _context.SaveChangesAsync();
                }
            }
        }

        return await MapTaskDtoAsync(task.Id);
    }

    public async Task DeleteTask(TaskExecutionDeleteTaskRequest request)
    {
        var task = await _context.ActionTasks
            .FirstOrDefaultAsync(x => x.Id == request.TaskId && !x.IsDeleted && x.IsActived);

        if (task == null)
        {
            throw new BusinessException("KhÃ´ng tÃ¬m tháº¥y cÃ´ng viá»‡c");
        }

        await GetEditablePlanAsync(task.ActionPlanId);

        var username = GetCurrentUsernameOrFallback();
        if (!IsAdmin() && !string.Equals(task.CreatedBy, username, StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessException("Bạn không có quyền xóa công việc của người khác");
        }

        if (task.TaskStatus != (int)ActionTaskStatus.Todo)
        {
            throw new BusinessException("Chá»‰ Ä‘Æ°á»£c xÃ³a cÃ´ng viá»‡c á»Ÿ tráº¡ng thÃ¡i chá» thá»±c hiá»‡n");
        }

        task.IsDeleted = true;
        task.IsActived = false;
        task.UpdatedAt = DateTime.UtcNow;
        task.UpdatedBy = GetCurrentUsernameOrFallback();

        _context.ActionTasks.Update(task);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TaskExecutionAttachmentDto>> UploadAttachment(TaskExecutionUploadAttachmentRequest request)
    {
        var task = await _context.ActionTasks
            .FirstOrDefaultAsync(x => x.Id == request.TaskId && !x.IsDeleted && x.IsActived)
            ?? throw new BusinessException("KhÃ´ng tÃ¬m tháº¥y cÃ´ng viá»‡c");

        await GetEditablePlanAsync(task.ActionPlanId);

        var attachments = await _uploadFileService.UploadDataAsync(
            task.Id.ToString(),
            "ActionTask",
            request.FolderUpload);

        var now = DateTime.UtcNow;
        var username = GetCurrentUsernameOrFallback();
        var created = new List<TaskExecutionAttachmentDto>();

        foreach (var item in attachments)
        {
            var entity = new ActionTaskAttachmentEntity
            {
                Id = item.Id == Guid.Empty ? Guid.NewGuid() : item.Id,
                ActionTaskId = task.Id,
                AttachmentId = item.Id == Guid.Empty ? null : item.Id,
                FileName = item.FileName,
                FileUrl = item.FileUrl,
                UploadedAt = now,
                UploadedBy = username,
                CreatedAt = now,
                CreatedBy = username,
                IsActived = true,
                IsDeleted = false
            };

            await _context.ActionTaskAttachments.AddAsync(entity);
            created.Add(new TaskExecutionAttachmentDto
            {
                Id = entity.Id,
                ActionTaskId = entity.ActionTaskId,
                AttachmentId = entity.AttachmentId,
                FileName = entity.FileName,
                FileUrl = entity.FileUrl,
                UploadedAt = entity.UploadedAt,
                UploadedBy = entity.UploadedBy
            });
        }

        await _context.SaveChangesAsync();
        return created;
    }

    public async Task DeleteAttachment(TaskExecutionDeleteAttachmentRequest request)
    {
        var attachment = await _context.ActionTaskAttachments
            .FirstOrDefaultAsync(x => x.Id == request.AttachmentId && !x.IsDeleted && x.IsActived);

        if (attachment == null)
        {
            throw new BusinessException("KhÃ´ng tÃ¬m tháº¥y tá»‡p Ä‘Ã­nh kÃ¨m");
        }

        var task = await _context.ActionTasks
            .FirstOrDefaultAsync(x => x.Id == attachment.ActionTaskId && !x.IsDeleted && x.IsActived)
            ?? throw new BusinessException("KhÃ´ng tÃ¬m tháº¥y cÃ´ng viá»‡c");

        await GetEditablePlanAsync(task.ActionPlanId);

        attachment.IsDeleted = true;
        attachment.IsActived = false;
        attachment.UpdatedAt = DateTime.UtcNow;
        attachment.UpdatedBy = GetCurrentUsernameOrFallback();

        _context.ActionTaskAttachments.Update(attachment);

        if (!string.IsNullOrWhiteSpace(attachment.FileUrl))
        {
            await _uploadFileService.DeleteDataAsync(new List<string> { attachment.FileUrl! });
        }

        await _context.SaveChangesAsync();
    }

    private IQueryable<ActionPlanEntity> BuildAssignedPlanQuery()
    {
        return _context.ActionPlans
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActived && x.Status == (int)ActionPlanStatus.InProgress);
    }

    private async Task<GetListPagingResponse<TaskExecutionPlanListItemDto>> BuildPlanListResponseAsync(
        IQueryable<ActionPlanEntity> query,
        TaskExecutionGetPlansRequest request)
    {
        if (request.CycleId.HasValue)
        {
            query = query.Where(x => x.CycleId == request.CycleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.TextSearch))
        {
            var text = request.TextSearch.Trim();
            query = query.Where(x =>
                x.Title.Contains(text)
                || (x.Description ?? string.Empty).Contains(text));
        }

        var totalRow = await query.CountAsync();
        var pageIndex = request.PageIndex <= 0 ? 1 : request.PageIndex;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var pagePlans = await query
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var planIds = pagePlans.Select(x => x.Id).ToList();
        var cycleIds = pagePlans.Select(x => x.CycleId).Distinct().ToList();
        var cycleNames = await _context.Cycles
            .AsNoTracking()
            .Where(x => cycleIds.Contains(x.Id))
            .Select(x => new { x.Id, x.Name, x.Year })
            .ToDictionaryAsync(x => x.Id, x => (x.Name, x.Year));

        var assignees = await _context.ActionPlanAssignees
            .AsNoTracking()
            .Where(x => planIds.Contains(x.ActionPlanId) && !x.IsDeleted && x.IsActived)
            .ToListAsync();
        var users = await LoadUsersAsync(assignees.Select(x => x.UserId));
        var assigneeGroups = assignees.GroupBy(x => x.ActionPlanId).ToDictionary(x => x.Key, x => x.ToList());

        var taskCounts = await _context.ActionTasks
            .AsNoTracking()
            .Where(x => planIds.Contains(x.ActionPlanId) && !x.IsDeleted && x.IsActived)
            .GroupBy(x => x.ActionPlanId)
            .Select(x => new
            {
                x.Key,
                Total = x.Count(),
                Done = x.Count(t => t.TaskStatus == (int)ActionTaskStatus.Done)
            })
            .ToDictionaryAsync(x => x.Key);

        var data = pagePlans.Select(plan =>
        {
            cycleNames.TryGetValue(plan.CycleId, out var cycleInfo);
            assigneeGroups.TryGetValue(plan.Id, out var planAssignees);
            taskCounts.TryGetValue(plan.Id, out var taskCount);

            var names = planAssignees == null
                ? string.Empty
                : string.Join(", ", planAssignees.Select(a =>
                {
                    if (users.TryGetValue(a.UserId, out var user))
                    {
                        return user.Fullname;
                    }

                    return a.UserId.ToString();
                }));

            return new TaskExecutionPlanListItemDto
            {
                Id = plan.Id,
                CycleId = plan.CycleId,
                CycleName = cycleInfo.Name,
                Year = cycleInfo.Year,
                Title = plan.Title,
                StandardId = plan.StandardId,
                CriterionId = plan.CriterionId,
                Priority = plan.Priority,
                Deadline = plan.Deadline,
                Status = plan.Status,
                AssignedToNames = names,
                StatusName = GetStatusName(plan.Status),
                TotalTaskCount = taskCount?.Total ?? 0,
                DoneTaskCount = taskCount?.Done ?? 0
            };
        }).ToList();

        return new GetListPagingResponse<TaskExecutionPlanListItemDto>
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            TotalRow = totalRow,
            Data = data
        };
    }

    private async Task<ActionPlanEntity> GetEditablePlanAsync(Guid actionPlanId)
    {
        var plan = await _context.ActionPlans
            .FirstOrDefaultAsync(x => x.Id == actionPlanId && !x.IsDeleted && x.IsActived)
            ?? throw new BusinessException("KhÃ´ng tÃ¬m tháº¥y káº¿ hoáº¡ch hÃ nh Ä‘á»™ng");

        if (plan.Status != (int)ActionPlanStatus.InProgress)
        {
            throw new BusinessException("Chá»‰ Ä‘Æ°á»£c thao tÃ¡c cÃ´ng viá»‡c khi káº¿ hoáº¡ch Ä‘ang thá»±c hiá»‡n");
        }

        await EnsurePlanAccessAsync(plan);
        return plan;
    }

    private async Task EnsurePlanAccessAsync(ActionPlanEntity plan)
    {
        if (IsAdmin())
        {
            return;
        }

        var userId = GetCurrentUserIdOrNull();
        if (userId == null)
        {
            throw new BusinessException("KhÃ´ng xÃ¡c Ä‘á»‹nh Ä‘Æ°á»£c ngÆ°á»i dÃ¹ng hiá»‡n táº¡i");
        }

        var canAccess = await _context.ActionPlanAssignees.AnyAsync(x =>
            x.ActionPlanId == plan.Id &&
            x.UserId == userId.Value &&
            !x.IsDeleted &&
            x.IsActived)
            || await _context.Councils.AnyAsync(x =>
                x.CycleId == plan.CycleId &&
                x.UserId == userId.Value &&
                !x.IsDeleted &&
                x.IsActived);

        if (!canAccess)
        {
            throw new BusinessException("Báº¡n khÃ´ng cÃ³ quyá»n thao tÃ¡c trÃªn káº¿ hoáº¡ch nÃ y");
        }
    }

    private async Task<TaskExecutionTaskDto> MapTaskDtoAsync(Guid taskId)
    {
        var task = await _context.ActionTasks
            .AsNoTracking()
            .FirstAsync(x => x.Id == taskId);

        var attachments = await _context.ActionTaskAttachments
            .AsNoTracking()
            .Where(x => x.ActionTaskId == taskId && !x.IsDeleted && x.IsActived)
            .OrderBy(x => x.CreatedAt)
            .Select(x => new TaskExecutionAttachmentDto
            {
                Id = x.Id,
                ActionTaskId = x.ActionTaskId,
                AttachmentId = x.AttachmentId,
                FileName = x.FileName,
                FileUrl = x.FileUrl,
                UploadedAt = x.UploadedAt,
                UploadedBy = x.UploadedBy
            })
            .ToListAsync();

        return new TaskExecutionTaskDto
        {
            Id = task.Id,
            ActionPlanId = task.ActionPlanId,
            Description = task.Description,
            Note = task.Note,
            TaskStatus = task.TaskStatus,
            DueDate = task.DueDate,
            CompletedAt = task.CompletedAt,
            CreatedBy = task.CreatedBy,
            Attachments = attachments
        };
    }

    private async Task<Dictionary<Guid, (string Fullname, string? Username)>> LoadUsersAsync(IEnumerable<Guid> userIds)
    {
        var distinct = userIds.Distinct().ToList();
        if (distinct.Count == 0)
        {
            return new Dictionary<Guid, (string Fullname, string? Username)>();
        }

        try
        {
            var request = new GetUsersByIdsRequest();
            request.UserIds.AddRange(distinct.Select(x => x.ToString()));
            var response = await _systemClient.GetUsersByIdsAsync(request);

            return response.Users
                .Where(x => Guid.TryParse(x.Id, out _))
                .ToDictionary(
                    x => Guid.Parse(x.Id),
                    x => (
                        Fullname: string.IsNullOrWhiteSpace(x.Fullname) ? x.Username : x.Fullname,
                        Username: string.IsNullOrWhiteSpace(x.Username) ? null : x.Username));
        }
        catch
        {
            return new Dictionary<Guid, (string Fullname, string? Username)>();
        }
    }

    private Guid? GetCurrentUserIdOrNull()
    {
        var userId = _contextAccessor.HttpContext?.User?.Claims
            .FirstOrDefault(x => x.Type == "name")?.Value;
        return Guid.TryParse(userId, out var parsed) ? parsed : null;
    }

    private string GetCurrentUsernameOrFallback()
    {
        var username = _contextAccessor.HttpContext?.User?.Claims
            .FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.UniqueName)?.Value
            ?? _contextAccessor.HttpContext?.User?.Identity?.Name
            ?? "System";

        return username.Trim();
    }

    private bool IsAdmin()
    {
        var username = _contextAccessor.HttpContext?.User?.Identity?.Name;
        return string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);
    }

    private static string? NormalizeText(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static int NormalizeTaskStatus(int status)
    {
        return status switch
        {
            (int)ActionTaskStatus.Todo => (int)ActionTaskStatus.Todo,
            (int)ActionTaskStatus.InProgress => (int)ActionTaskStatus.InProgress,
            (int)ActionTaskStatus.Done => (int)ActionTaskStatus.Done,
            _ => (int)ActionTaskStatus.Todo
        };
    }

    private static string GetStatusName(int status)
    {
        return status switch
        {
            (int)ActionPlanStatus.Draft => "NhÃ¡p",
            (int)ActionPlanStatus.InProgress => "Äang thá»±c hiá»‡n",
            (int)ActionPlanStatus.PendingReview => "Chá» xÃ¡c nháº­n",
            (int)ActionPlanStatus.Completed => "HoÃ n thÃ nh",
            _ => "KhÃ´ng xÃ¡c Ä‘á»‹nh"
        };
    }

    private static GetListPagingResponse<TaskExecutionPlanListItemDto> EmptyList(TaskExecutionGetPlansRequest request)
    {
        return new GetListPagingResponse<TaskExecutionPlanListItemDto>
        {
            PageIndex = request.PageIndex <= 0 ? 1 : request.PageIndex,
            PageSize = request.PageSize <= 0 ? 10 : request.PageSize,
            TotalRow = 0,
            Data = new List<TaskExecutionPlanListItemDto>()
        };
    }
}

