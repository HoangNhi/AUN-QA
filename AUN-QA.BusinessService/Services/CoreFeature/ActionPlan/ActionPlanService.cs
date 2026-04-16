using System.IdentityModel.Tokens.Jwt;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.Shared.Exceptions;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;
using ActionPlanEntity = AUN_QA.BusinessService.Entities.ActionPlan;
using ActionPlanAssigneeEntity = AUN_QA.BusinessService.Entities.ActionPlanAssignee;
using ActionTaskEntity = AUN_QA.BusinessService.Entities.ActionTask;
using ActionTaskAttachmentEntity = AUN_QA.BusinessService.Entities.ActionTaskAttachment;

namespace AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;

[RegisterClassAsTransient]
public class ActionPlanService : IActionPlanService
{
    private readonly BusinessContext _context;
    private readonly IHttpContextAccessor _contextAccessor;
    private readonly SystemProto.SystemProtoClient _systemClient;

    public ActionPlanService(
        BusinessContext context,
        IHttpContextAccessor contextAccessor,
        SystemProto.SystemProtoClient systemClient)
    {
        _context = context;
        _contextAccessor = contextAccessor;
        _systemClient = systemClient;
    }

    public async Task<GetListPagingResponse<ActionPlanListItemDto>> GetList(ActionPlanGetListPagingRequest request)
    {
        var query = _context.ActionPlans
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.IsActived);

        if (request.CycleId.HasValue)
        {
            query = query.Where(x => x.CycleId == request.CycleId.Value);
        }

        if (request.StandardId.HasValue)
        {
            query = query.Where(x => x.StandardId == request.StandardId.Value);
        }

        if (request.CriterionId.HasValue)
        {
            query = query.Where(x => x.CriterionId == request.CriterionId.Value);
        }

        if (request.SourceFindingId.HasValue)
        {
            query = query.Where(x => x.SourceFindingId == request.SourceFindingId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(x => x.Status == request.Status.Value);
        }

        if (request.Priority.HasValue)
        {
            query = query.Where(x => x.Priority == request.Priority.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.TextSearch))
        {
            var text = request.TextSearch.Trim();
            query = query.Where(x =>
                x.Title.Contains(text)
                || (x.Description ?? string.Empty).Contains(text)
                || x.Kpi.Contains(text));
        }

        if (!IsAdmin())
        {
            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                return EmptyList<ActionPlanListItemDto>(request);
            }

            query = query.Where(x =>
                _context.Councils.Any(c =>
                    c.CycleId == x.CycleId &&
                    c.UserId == userId.Value &&
                    !c.IsDeleted &&
                    c.IsActived)
                || _context.ActionPlanAssignees.Any(a =>
                    a.ActionPlanId == x.Id &&
                    a.UserId == userId.Value &&
                    !a.IsDeleted &&
                    a.IsActived)
                || x.CreatedBy == GetCurrentUsernameOrFallback());
        }

        var totalRow = await query.CountAsync();
        var pageIndex = request.PageIndex <= 0 ? 1 : request.PageIndex;
        var pageSize = request.PageSize <= 0 ? 10 : request.PageSize;

        var pageItems = await query
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var planIds = pageItems.Select(x => x.Id).ToList();
        var assigneeCounts = await _context.ActionPlanAssignees
            .AsNoTracking()
            .Where(x => planIds.Contains(x.ActionPlanId) && !x.IsDeleted && x.IsActived)
            .GroupBy(x => x.ActionPlanId)
            .Select(x => new { x.Key, Count = x.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);

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

        var cycleIds = pageItems.Select(x => x.CycleId).Distinct().ToList();
        var cycleNames = await _context.Cycles
            .AsNoTracking()
            .Where(x => cycleIds.Contains(x.Id))
            .Select(x => new { x.Id, x.Name, x.Year })
            .ToDictionaryAsync(x => x.Id, x => (x.Name, x.Year));

        var data = pageItems.Select(x =>
        {
            cycleNames.TryGetValue(x.CycleId, out var cycleInfo);
            assigneeCounts.TryGetValue(x.Id, out var assigneeCount);
            taskCounts.TryGetValue(x.Id, out var taskCount);

            return new ActionPlanListItemDto
            {
                Id = x.Id,
                CycleId = x.CycleId,
                CycleName = cycleInfo.Name,
                Year = cycleInfo.Year,
                Title = x.Title,
                Description = x.Description,
                StandardId = x.StandardId,
                CriterionId = x.CriterionId,
                Priority = x.Priority,
                Deadline = x.Deadline,
                Kpi = x.Kpi,
                Status = x.Status,
                AssigneeCount = assigneeCount,
                TotalTaskCount = taskCount?.Total ?? 0,
                DoneTaskCount = taskCount?.Done ?? 0,
                StatusName = GetStatusName(x.Status),
                PriorityName = GetPriorityName(x.Priority)
            };
        }).ToList();

        return new GetListPagingResponse<ActionPlanListItemDto>
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            TotalRow = totalRow,
            Data = data
        };
    }

    public async Task<ActionPlanDetailDto> GetById(Guid id)
    {
        var plan = await _context.ActionPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted && x.IsActived);

        if (plan == null)
        {
            throw new BusinessException("Không tìm thấy kế hoạch hành động");
        }

        await EnsureCanViewPlanAsync(plan);
        return await BuildDetailAsync(plan);
    }

    public async Task<ActionPlanDetailDto> Insert(ActionPlanUpsertRequest request)
    {
        await EnsureActCycleAsync(request.CycleId);

        var now = DateTime.UtcNow;
        var username = GetCurrentUsernameOrFallback();

        var plan = new ActionPlanEntity
        {
            Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id,
            CycleId = request.CycleId,
            Title = request.Title.Trim(),
            Description = NormalizeText(request.Description),
            StandardId = request.StandardId,
            CriterionId = request.CriterionId,
            Priority = request.Priority <= 0 ? (int)ActionPriority.Medium : request.Priority,
            Deadline = request.Deadline,
            Kpi = request.Kpi.Trim(),
            Status = (int)ActionPlanStatus.Draft,
            SourceFindingId = request.SourceFindingId,
            CreatedAt = now,
            CreatedBy = username,
            IsActived = request.IsActived,
            IsDeleted = false
        };

        await _context.ActionPlans.AddAsync(plan);
        await _context.SaveChangesAsync();

        return await GetById(plan.Id);
    }

    public async Task<ActionPlanDetailDto> Update(ActionPlanUpsertRequest request)
    {
        var plan = await _context.ActionPlans.FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted);
        if (plan == null)
        {
            throw new BusinessException("Không tìm thấy kế hoạch hành động");
        }

        await EnsureActCycleAsync(plan.CycleId);
        EnsureEditablePlan(plan);

        plan.Title = request.Title.Trim();
        plan.Description = NormalizeText(request.Description);
        plan.StandardId = request.StandardId;
        plan.CriterionId = request.CriterionId;
        plan.Priority = request.Priority <= 0 ? (int)ActionPriority.Medium : request.Priority;
        plan.Deadline = request.Deadline;
        plan.Kpi = request.Kpi.Trim();
        plan.SourceFindingId = request.SourceFindingId;
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = GetCurrentUsernameOrFallback();
        plan.IsActived = request.IsActived;

        _context.ActionPlans.Update(plan);
        await _context.SaveChangesAsync();

        return await GetById(plan.Id);
    }

    public async Task DeleteList(ActionPlanDeleteListRequest request)
    {
        if (request.Ids == null || request.Ids.Count == 0)
        {
            throw new BusinessException("Danh sách dữ liệu không được để trống");
        }

        var plans = await _context.ActionPlans
            .Where(x => request.Ids.Contains(x.Id) && !x.IsDeleted)
            .ToListAsync();

        if (plans.Count != request.Ids.Count)
        {
            throw new BusinessException("Không tìm thấy kế hoạch hành động");
        }

        foreach (var plan in plans)
        {
            EnsureDraftOnly(plan);
            plan.IsDeleted = true;
            plan.IsActived = false;
            plan.UpdatedAt = DateTime.UtcNow;
            plan.UpdatedBy = GetCurrentUsernameOrFallback();
        }

        await _context.SaveChangesAsync();
    }

    public async Task Submit(ActionPlanSubmitRequest request)
    {
        var plan = await GetManagedPlanAsync(request.Id);

        if (plan.Status != (int)ActionPlanStatus.Draft && plan.Status != (int)ActionPlanStatus.RevisionRequested)
        {
            throw new BusinessException("Chỉ được gửi kế hoạch ở trạng thái nháp hoặc yêu cầu chỉnh sửa");
        }

        plan.Status = (int)ActionPlanStatus.Submitted;
        plan.SubmittedAt = DateTime.UtcNow;
        plan.SubmittedBy = GetCurrentUsernameOrFallback();
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = plan.SubmittedBy;

        await _context.SaveChangesAsync();
    }

    public async Task Approve(ActionPlanApproveRequest request)
    {
        var plan = await GetManagedPlanAsync(request.Id);

        if (plan.Status != (int)ActionPlanStatus.Submitted)
        {
            throw new BusinessException("Chỉ được duyệt kế hoạch đang ở trạng thái chờ duyệt");
        }

        plan.Status = (int)ActionPlanStatus.Approved;
        plan.ApprovedAt = DateTime.UtcNow;
        plan.ApprovedBy = GetCurrentUsernameOrFallback();
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = plan.ApprovedBy;

        await _context.SaveChangesAsync();
    }

    public async Task RequestRevision(ActionPlanRequestRevisionRequest request)
    {
        var plan = await GetManagedPlanAsync(request.Id);

        if (plan.Status != (int)ActionPlanStatus.Submitted)
        {
            throw new BusinessException("Chỉ được yêu cầu chỉnh sửa khi kế hoạch đang ở trạng thái chờ duyệt");
        }

        plan.Status = (int)ActionPlanStatus.RevisionRequested;
        plan.RevisionRequestedAt = DateTime.UtcNow;
        plan.RevisionRequestedBy = GetCurrentUsernameOrFallback();
        plan.RevisionReason = request.Reason.Trim();
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = plan.RevisionRequestedBy;

        await _context.SaveChangesAsync();
    }

    public async Task Assign(ActionPlanAssignRequest request)
    {
        var plan = await GetManagedPlanAsync(request.Id);

        if (plan.Status != (int)ActionPlanStatus.Approved)
        {
            throw new BusinessException("Chỉ được giao kế hoạch đã được phê duyệt");
        }

        if (request.AssignedTo.Count == 0)
        {
            throw new BusinessException("Danh sách người thực hiện không được để trống");
        }

        var now = DateTime.UtcNow;
        var username = GetCurrentUsernameOrFallback();

        var currentAssignees = await _context.ActionPlanAssignees
            .Where(x => x.ActionPlanId == plan.Id && !x.IsDeleted && x.IsActived)
            .ToListAsync();

        foreach (var assignee in currentAssignees)
        {
            assignee.IsDeleted = true;
            assignee.IsActived = false;
            assignee.UpdatedAt = now;
            assignee.UpdatedBy = username;
        }

        foreach (var userId in request.AssignedTo.Distinct())
        {
            await _context.ActionPlanAssignees.AddAsync(new ActionPlanAssigneeEntity
            {
                Id = Guid.NewGuid(),
                ActionPlanId = plan.Id,
                UserId = userId,
                AssignedAt = now,
                AssignedBy = username,
                CreatedAt = now,
                CreatedBy = username,
                IsActived = true,
                IsDeleted = false
            });
        }

        plan.Status = (int)ActionPlanStatus.Assigned;
        plan.AssignedAt = now;
        plan.AssignedBy = username;
        plan.UpdatedAt = now;
        plan.UpdatedBy = username;

        await _context.SaveChangesAsync();
    }

    public async Task<List<ExternalFindingOptionDto>> GetExternalReviewFindings(ActionPlanExternalFindingRequest request)
    {
        var query = from finding in _context.ExternalReviewFindings.AsNoTracking()
                    join result in _context.ExternalReviewResults.AsNoTracking()
                        on finding.ExternalReviewResultId equals result.Id
                    join review in _context.ExternalReviews.AsNoTracking()
                        on result.ExternalReviewId equals review.Id
                    where !finding.IsDeleted && finding.IsActived
                          && !result.IsDeleted && result.IsActived
                          && !review.IsDeleted && review.IsActived
                    select new { finding, result, review };

        if (request.CycleId.HasValue)
        {
            query = query.Where(x => x.review.CycleId == request.CycleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.TextSearch))
        {
            var text = request.TextSearch.Trim();
            query = query.Where(x => x.finding.Content.Contains(text));
        }

        var items = await query
            .OrderByDescending(x => x.finding.CreatedAt)
            .Select(x => new ExternalFindingOptionDto
            {
                Id = x.finding.Id,
                ExternalReviewResultId = x.finding.ExternalReviewResultId,
                CriterionId = x.finding.CriterionId,
                StandardId = x.result.StandardId,
                Content = x.finding.Content,
                Summary = x.finding.Content.Length > 120
                    ? x.finding.Content.Substring(0, 120) + "..."
                    : x.finding.Content
            })
            .ToListAsync();

        return items;
    }

    private async Task EnsureActCycleAsync(Guid cycleId)
    {
        var cycle = await _context.Cycles.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == cycleId && !x.IsDeleted && x.IsActived)
            ?? throw new BusinessException("Không tìm thấy chu kỳ đánh giá");

        if (cycle.Status != (int)CycleStatus.Act)
        {
            throw new BusinessException("Chỉ được thao tác kế hoạch cải tiến trong pha ACT");
        }
    }

    private async Task<ActionPlanEntity> GetManagedPlanAsync(Guid planId)
    {
        var plan = await _context.ActionPlans.FirstOrDefaultAsync(x => x.Id == planId && !x.IsDeleted && x.IsActived);
        if (plan == null)
        {
            throw new BusinessException("Không tìm thấy kế hoạch hành động");
        }

        await EnsureCanManageAsync(plan);
        return plan;
    }

    private async Task EnsureCanViewPlanAsync(ActionPlanEntity plan)
    {
        if (IsAdmin())
        {
            return;
        }

        var userId = GetCurrentUserIdOrNull();
        if (userId == null)
        {
            throw new BusinessException("Không xác định được người dùng hiện tại");
        }

        var canView = await _context.Councils.AnyAsync(x =>
            x.CycleId == plan.CycleId &&
            x.UserId == userId.Value &&
            !x.IsDeleted &&
            x.IsActived)
            || await _context.ActionPlanAssignees.AnyAsync(x =>
                x.ActionPlanId == plan.Id &&
                x.UserId == userId.Value &&
                !x.IsDeleted &&
                x.IsActived)
            || string.Equals(plan.CreatedBy, GetCurrentUsernameOrFallback(), StringComparison.OrdinalIgnoreCase);

        if (!canView)
        {
            throw new BusinessException("Bạn không có quyền xem kế hoạch hành động này");
        }
    }

    private async Task EnsureCanManageAsync(ActionPlanEntity plan)
    {
        await EnsureCanViewPlanAsync(plan);

        if (IsAdmin())
        {
            return;
        }

        var username = GetCurrentUsernameOrFallback();
        if (!string.Equals(plan.CreatedBy, username, StringComparison.OrdinalIgnoreCase))
        {
            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                throw new BusinessException("Bạn không có quyền thao tác trên kế hoạch hành động này");
            }

            var isAssignee = await _context.ActionPlanAssignees.AnyAsync(x =>
                x.ActionPlanId == plan.Id &&
                x.UserId == userId.Value &&
                !x.IsDeleted &&
                x.IsActived);

            var isCouncilMember = await _context.Councils.AnyAsync(x =>
                x.CycleId == plan.CycleId &&
                x.UserId == userId.Value &&
                !x.IsDeleted &&
                x.IsActived);

            if (!isAssignee && !isCouncilMember)
            {
                throw new BusinessException("Bạn không có quyền thao tác trên kế hoạch hành động này");
            }
        }
    }

    private void EnsureEditablePlan(ActionPlanEntity plan)
    {
        if (plan.Status != (int)ActionPlanStatus.Draft && plan.Status != (int)ActionPlanStatus.RevisionRequested)
        {
            throw new BusinessException("Chỉ được chỉnh sửa kế hoạch ở trạng thái nháp hoặc yêu cầu chỉnh sửa");
        }
    }

    private void EnsureDraftOnly(ActionPlanEntity plan)
    {
        if (plan.Status != (int)ActionPlanStatus.Draft)
        {
            throw new BusinessException("Chỉ được xóa kế hoạch ở trạng thái nháp");
        }
    }

    private async Task<ActionPlanDetailDto> BuildDetailAsync(ActionPlanEntity plan)
    {
        var assignees = await _context.ActionPlanAssignees
            .AsNoTracking()
            .Where(x => x.ActionPlanId == plan.Id && !x.IsDeleted && x.IsActived)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        var tasks = await _context.ActionTasks
            .AsNoTracking()
            .Where(x => x.ActionPlanId == plan.Id && !x.IsDeleted && x.IsActived)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        var assigneeUsers = await LoadUsersAsync(assignees.Select(x => x.UserId));
        var taskIds = tasks.Select(x => x.Id).ToList();
        var attachments = taskIds.Count == 0
            ? new List<ActionTaskAttachmentEntity>()
            : await _context.ActionTaskAttachments
                .AsNoTracking()
                .Where(x => taskIds.Contains(x.ActionTaskId) && !x.IsDeleted && x.IsActived)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();
        var attachmentGroups = attachments.GroupBy(x => x.ActionTaskId).ToDictionary(x => x.Key, x => x.ToList());

        return new ActionPlanDetailDto
        {
            Id = plan.Id,
            CycleId = plan.CycleId,
            Title = plan.Title,
            Description = plan.Description,
            StandardId = plan.StandardId,
            CriterionId = plan.CriterionId,
            Priority = plan.Priority,
            Deadline = plan.Deadline,
            Kpi = plan.Kpi,
            Status = plan.Status,
            SourceFindingId = plan.SourceFindingId,
            SubmittedAt = plan.SubmittedAt,
            SubmittedBy = plan.SubmittedBy,
            ApprovedAt = plan.ApprovedAt,
            ApprovedBy = plan.ApprovedBy,
            RevisionRequestedAt = plan.RevisionRequestedAt,
            RevisionRequestedBy = plan.RevisionRequestedBy,
            RevisionReason = plan.RevisionReason,
            AssignedAt = plan.AssignedAt,
            AssignedBy = plan.AssignedBy,
            Assignees = assignees.Select(x =>
            {
                assigneeUsers.TryGetValue(x.UserId, out var userInfo);
                return new ActionPlanAssigneeDto
                {
                    Id = x.Id,
                    ActionPlanId = x.ActionPlanId,
                    UserId = x.UserId,
                    AssignedAt = x.AssignedAt,
                    AssignedBy = x.AssignedBy,
                    Fullname = userInfo.Fullname,
                    Username = userInfo.Username
                };
            }).ToList(),
            Tasks = tasks.Select(x =>
            {
                attachmentGroups.TryGetValue(x.Id, out var taskAttachments);
                return new ActionTaskDto
                {
                    Id = x.Id,
                    ActionPlanId = x.ActionPlanId,
                    Description = x.Description,
                    Note = x.Note,
                    TaskStatus = x.TaskStatus,
                    DueDate = x.DueDate,
                    CompletedAt = x.CompletedAt,
                    Attachments = (taskAttachments ?? new List<ActionTaskAttachmentEntity>())
                        .Select(a => new ActionTaskAttachmentDto
                        {
                            Id = a.Id,
                            ActionTaskId = a.ActionTaskId,
                            AttachmentId = a.AttachmentId,
                            FileName = a.FileName,
                            FileUrl = a.FileUrl,
                            UploadedAt = a.UploadedAt,
                            UploadedBy = a.UploadedBy
                        }).ToList()
                };
            }).ToList()
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
                        Username: string.IsNullOrWhiteSpace(x.Username) ? null : x.Username),
                    EqualityComparer<Guid>.Default);
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

    private static string GetStatusName(int status)
    {
        return status switch
        {
            (int)ActionPlanStatus.Draft => "Nháp",
            (int)ActionPlanStatus.Submitted => "Chờ duyệt",
            (int)ActionPlanStatus.RevisionRequested => "Yêu cầu chỉnh sửa",
            (int)ActionPlanStatus.Approved => "Đã duyệt",
            (int)ActionPlanStatus.Assigned => "Đã giao",
            _ => "Không xác định"
        };
    }

    private static string GetPriorityName(int priority)
    {
        return priority switch
        {
            (int)ActionPriority.High => "Cao",
            (int)ActionPriority.Medium => "Trung bình",
            (int)ActionPriority.Low => "Thấp",
            _ => "Không xác định"
        };
    }

    private static GetListPagingResponse<T> EmptyList<T>(ActionPlanGetListPagingRequest request)
    {
        return new GetListPagingResponse<T>
        {
            PageIndex = request.PageIndex <= 0 ? 1 : request.PageIndex,
            PageSize = request.PageSize <= 0 ? 10 : request.PageSize,
            TotalRow = 0,
            Data = new List<T>()
        };
    }
}
