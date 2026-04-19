using System.IdentityModel.Tokens.Jwt;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.Shared.Exceptions;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;
using ActionPlanEntity = AUN_QA.BusinessService.Entities.ActionPlan;
using ActionPlanAssigneeEntity = AUN_QA.BusinessService.Entities.ActionPlanAssignee;
using ActionPlanAttachmentEntity = AUN_QA.BusinessService.Entities.ActionPlanAttachment;

namespace AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;

[RegisterClassAsTransient]
public class ActionPlanService : IActionPlanService
{
    private static readonly Guid ExternalReviewerRoleId = new("551d1351-008e-4910-a39c-1fcdde409fdf");

    private readonly BusinessContext _context;
    private readonly IHttpContextAccessor _contextAccessor;
    private readonly SystemProto.SystemProtoClient _systemClient;
    private readonly IUploadFileService _uploadFileService;
    private readonly IMapper _mapper;
    private readonly ICatalogIntegrationService _catalogService;

    public ActionPlanService(
        BusinessContext context,
        IHttpContextAccessor contextAccessor,
        SystemProto.SystemProtoClient systemClient,
        IUploadFileService uploadFileService,
        IMapper mapper,
        ICatalogIntegrationService catalogService)
    {
        _context = context;
        _contextAccessor = contextAccessor;
        _systemClient = systemClient;
        _uploadFileService = uploadFileService;
        _mapper = mapper;
        _catalogService = catalogService;
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
                || (x.Description ?? string.Empty).Contains(text));
        }

        if (!IsAdmin())
        {
            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                return EmptyList<ActionPlanListItemDto>(request);
            }

            var currentUsername = GetCurrentUsernameOrFallback();
            query = query.Where(x =>
                _context.Councils.Any(c =>
                    c.CycleId == x.CycleId
                    && c.UserId == userId.Value
                    && !c.IsDeleted
                    && c.IsActived)
                || _context.ActionPlanAssignees.Any(a =>
                    a.ActionPlanId == x.Id
                    && a.UserId == userId.Value
                    && !a.IsDeleted
                    && a.IsActived)
                || x.CreatedBy == currentUsername);
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
                CycleName = cycleInfo.Name ?? string.Empty,
                Year = cycleInfo.Year,
                Title = x.Title,
                Description = x.Description,
                StandardId = x.StandardId,
                CriterionId = x.CriterionId,
                Priority = x.Priority,
                Deadline = x.Deadline,
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
        ValidateStatusTransition((int)ActionPlanStatus.Draft, request.Status);

        if (request.Status == (int)ActionPlanStatus.InProgress && (request.AssignedTo?.Count ?? 0) == 0)
        {
            throw new BusinessException("Vui lòng chọn ít nhất một người thực hiện");
        }

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
            Status = request.Status,
            SourceFindingId = request.SourceFindingId,
            CompletedAt = request.Status == (int)ActionPlanStatus.Completed ? now : null,
            CompletedBy = request.Status == (int)ActionPlanStatus.Completed ? username : null,
            AssignedAt = request.Status == (int)ActionPlanStatus.InProgress ? now : null,
            AssignedBy = request.Status == (int)ActionPlanStatus.InProgress ? username : null,
            CreatedAt = now,
            CreatedBy = username,
            IsActived = request.IsActived,
            IsDeleted = false
        };

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.ActionPlans.AddAsync(plan);
            await _context.SaveChangesAsync();

            var attachments = await _uploadFileService.UploadDataAsync(
                plan.Id.ToString(),
                "ActionPlan",
                request.FolderUpload);

            foreach (var attachment in attachments)
            {
                var addAttachment = _mapper.Map<ActionPlanAttachmentEntity>(attachment);
                addAttachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
                addAttachment.RelatedId = plan.Id;
                addAttachment.CreatedBy = username;
                addAttachment.CreatedAt = now;
                addAttachment.IsActived = true;
                addAttachment.IsDeleted = false;

                await _context.ActionPlanAttachments.AddAsync(addAttachment);
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

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
        await EnsureCanManageAsync(plan);
        ValidateStatusTransition(plan.Status, request.Status);

        if (request.Status == (int)ActionPlanStatus.InProgress && (request.AssignedTo?.Count ?? 0) == 0)
        {
            throw new BusinessException("Vui lòng chọn ít nhất một người thực hiện");
        }

        var now = DateTime.UtcNow;
        var username = GetCurrentUsernameOrFallback();
        var assignedTo = request.AssignedTo?.Distinct().ToList() ?? new List<Guid>();
        var attachmentIds = request.AttachmentIds?.Distinct().ToHashSet() ?? new HashSet<Guid>();

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

        foreach (var userId in assignedTo)
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

        if (plan.Status != (int)ActionPlanStatus.InProgress && request.Status == (int)ActionPlanStatus.InProgress)
        {
            plan.AssignedAt = now;
            plan.AssignedBy = username;
        }

        if (request.Status == (int)ActionPlanStatus.Completed && plan.Status != (int)ActionPlanStatus.Completed)
        {
            plan.CompletedAt = now;
            plan.CompletedBy = username;
        }

        plan.Title = request.Title.Trim();
        plan.Description = NormalizeText(request.Description);
        plan.StandardId = request.StandardId;
        plan.CriterionId = request.CriterionId;
        plan.Priority = request.Priority <= 0 ? (int)ActionPriority.Medium : request.Priority;
        plan.Deadline = request.Deadline;
        plan.SourceFindingId = request.SourceFindingId;
        plan.Status = request.Status;
        plan.UpdatedAt = now;
        plan.UpdatedBy = username;

        var attachmentsToRemove = await _context.ActionPlanAttachments
            .Where(x => x.RelatedId == plan.Id && !x.IsDeleted && !attachmentIds.Contains(x.Id))
            .ToListAsync();

        if (attachmentsToRemove.Count > 0)
        {
            await _uploadFileService.DeleteDataAsync(attachmentsToRemove.Select(x => x.FileUrl).ToList());
            foreach (var attachment in attachmentsToRemove)
            {
                attachment.IsDeleted = true;
                attachment.IsActived = false;
                attachment.UpdatedAt = now;
                attachment.UpdatedBy = username;
                _context.ActionPlanAttachments.Update(attachment);
            }
        }

        var newAttachments = await _uploadFileService.UploadDataAsync(plan.Id.ToString(), "ActionPlan", request.FolderUpload);
        foreach (var attachment in newAttachments)
        {
            var addAttachment = _mapper.Map<ActionPlanAttachmentEntity>(attachment);
            addAttachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
            addAttachment.RelatedId = plan.Id;
            addAttachment.CreatedBy = username;
            addAttachment.CreatedAt = now;
            addAttachment.IsActived = true;
            addAttachment.IsDeleted = false;
            await _context.ActionPlanAttachments.AddAsync(addAttachment);
        }

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
            if (plan.Status != (int)ActionPlanStatus.Draft)
            {
                throw new BusinessException("Chỉ được xóa kế hoạch ở trạng thái nháp");
            }

            plan.IsDeleted = true;
            plan.IsActived = false;
            plan.UpdatedAt = DateTime.UtcNow;
            plan.UpdatedBy = GetCurrentUsernameOrFallback();
        }

        await _context.SaveChangesAsync();
    }

    public async Task<List<ExternalFindingOptionDto>> GetExternalReviewFindings(ActionPlanExternalFindingRequest request)
    {
        var query = from finding in _context.ExternalReviewFindings.AsNoTracking()
                    join result in _context.ExternalReviewResults.AsNoTracking()
                        on finding.ExternalReviewResultId equals result.Id
                    join review in _context.ExternalReviews.AsNoTracking()
                        on result.ExternalReviewId equals review.Id
                    join cycle in _context.Cycles.AsNoTracking()
                        on review.CycleId equals cycle.Id
                    where !finding.IsDeleted && finding.IsActived
                          && !result.IsDeleted && result.IsActived
                          && !review.IsDeleted && review.IsActived
                          && !cycle.IsDeleted && cycle.IsActived
                    select new
                    {
                        Finding = finding,
                        StandardId = result.StandardId,
                        CycleId = review.CycleId,
                        CycleStandardSetId = cycle.StandardSetId
                    };

        if (request.CycleId.HasValue)
        {
            query = query.Where(x => x.CycleId == request.CycleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.TextSearch))
        {
            var text = request.TextSearch.Trim();
            query = query.Where(x => x.Finding.Content.Contains(text));
        }

        query = query.Where(x =>
            !_context.ActionPlans.Any(ap =>
                ap.SourceFindingId == x.Finding.Id
                && !ap.IsDeleted
                && ap.IsActived
                && (request.CurrentActionPlanId == null || ap.Id != request.CurrentActionPlanId.Value)));

        var rows = await query
            .OrderByDescending(x => x.Finding.CreatedAt)
            .ToListAsync();

        if (rows.Count == 0)
        {
            return new List<ExternalFindingOptionDto>();
        }

        var metadataByStandardSet = await BuildMetadataByStandardSetAsync(
            rows.Select(x => x.CycleStandardSetId).Distinct().ToList());

        return rows.Select(row =>
        {
            var dto = new ExternalFindingOptionDto
            {
                Id = row.Finding.Id,
                ExternalReviewResultId = row.Finding.ExternalReviewResultId,
                CriterionId = row.Finding.CriterionId,
                StandardId = row.StandardId,
                Content = row.Finding.Content,
                Summary = row.Finding.Content.Length > 120
                    ? row.Finding.Content.Substring(0, 120) + "..."
                    : row.Finding.Content
            };

            if (metadataByStandardSet.TryGetValue(row.CycleStandardSetId, out var bundle))
            {
                if (bundle.Standards.TryGetValue(row.StandardId, out var standardMeta))
                {
                    dto.StandardCode = standardMeta.Code;
                    dto.StandardName = standardMeta.Name;
                }

                if (row.Finding.CriterionId.HasValue
                    && bundle.Criteria.TryGetValue(row.Finding.CriterionId.Value, out var criterionMeta))
                {
                    dto.CriterionCode = criterionMeta.Code;
                    dto.CriterionName = criterionMeta.Name;
                }
            }

            return dto;
        }).ToList();
    }

    public async Task<List<AssignableMemberDto>> GetAssignableMembers(Guid cycleId)
    {
        var councilMembers = await _context.Councils
            .AsNoTracking()
            .Where(x => x.CycleId == cycleId
                && x.RoleId >= (int)CouncilRole.Evaluator
                && !x.IsDeleted
                && x.IsActived)
            .ToListAsync();

        if (councilMembers.Count == 0)
        {
            return new List<AssignableMemberDto>();
        }

        var users = await LoadUsersAsync(councilMembers.Select(x => x.UserId));

        return councilMembers.Select(x =>
        {
            users.TryGetValue(x.UserId, out var userInfo);
            return new AssignableMemberDto
            {
                UserId = x.UserId,
                Fullname = string.IsNullOrWhiteSpace(userInfo.Fullname) ? x.UserId.ToString() : userInfo.Fullname,
                Username = userInfo.Username
            };
        }).ToList();
    }

    public async Task<List<AssignableMemberDto>> GetAssignableUsersCombobox()
    {
        try
        {
            var response = await _systemClient.GetActiveUsersExceptRoleAsync(
                new GetActiveUsersExceptRoleRequest
                {
                    ExcludedRoleId = ExternalReviewerRoleId.ToString()
                });

            return response.Users
                .Where(x => Guid.TryParse(x.Id, out _))
                .Select(x => new AssignableMemberDto
                {
                    UserId = Guid.Parse(x.Id),
                    Fullname = string.IsNullOrWhiteSpace(x.Fullname) ? x.Username : x.Fullname,
                    Username = string.IsNullOrWhiteSpace(x.Username) ? null : x.Username
                })
                .OrderBy(x => x.Fullname)
                .ThenBy(x => x.Username)
                .ToList();
        }
        catch (RpcException ex)
        {
            throw new BusinessException($"Lỗi kết nối đến SystemService. {ex.Status.Detail}", ex);
        }
    }

    public async Task<int> GetMyCouncilRoleId(Guid cycleId)
    {
        if (IsAdmin())
        {
            return (int)CouncilRole.HeadOfCouncil;
        }

        var userId = GetCurrentUserIdOrNull();
        if (userId == null)
        {
            return 0;
        }

        var council = await _context.Councils
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.CycleId == cycleId
                && x.UserId == userId.Value
                && !x.IsDeleted
                && x.IsActived);

        return council?.RoleId ?? 0;
    }

    private static void ValidateStatusTransition(int current, int requested)
    {
        if (current == requested)
        {
            return;
        }

        var allowed = current switch
        {
            (int)ActionPlanStatus.Draft => new[] { (int)ActionPlanStatus.Draft, (int)ActionPlanStatus.InProgress },
            (int)ActionPlanStatus.InProgress => new[] { (int)ActionPlanStatus.Draft, (int)ActionPlanStatus.InProgress, (int)ActionPlanStatus.PendingReview },
            (int)ActionPlanStatus.PendingReview => new[] { (int)ActionPlanStatus.InProgress, (int)ActionPlanStatus.PendingReview, (int)ActionPlanStatus.Completed },
            (int)ActionPlanStatus.Completed => new[] { (int)ActionPlanStatus.InProgress, (int)ActionPlanStatus.Completed },
            _ => Array.Empty<int>()
        };

        if (!allowed.Contains(requested))
        {
            throw new BusinessException($"Không thể chuyển trạng thái từ {GetStatusName(current)} sang {GetStatusName(requested)}");
        }
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
                x.CycleId == plan.CycleId
                && x.UserId == userId.Value
                && !x.IsDeleted
                && x.IsActived)
            || await _context.ActionPlanAssignees.AnyAsync(x =>
                x.ActionPlanId == plan.Id
                && x.UserId == userId.Value
                && !x.IsDeleted
                && x.IsActived)
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
        if (string.Equals(plan.CreatedBy, username, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var userId = GetCurrentUserIdOrNull();
        if (userId == null)
        {
            throw new BusinessException("Bạn không có quyền thao tác trên kế hoạch hành động này");
        }

        var isAssignee = await _context.ActionPlanAssignees.AnyAsync(x =>
            x.ActionPlanId == plan.Id
            && x.UserId == userId.Value
            && !x.IsDeleted
            && x.IsActived);

        var isCouncilMember = await _context.Councils.AnyAsync(x =>
            x.CycleId == plan.CycleId
            && x.UserId == userId.Value
            && !x.IsDeleted
            && x.IsActived);

        if (!isAssignee && !isCouncilMember)
        {
            throw new BusinessException("Bạn không có quyền thao tác trên kế hoạch hành động này");
        }
    }

    private async Task<ActionPlanDetailDto> BuildDetailAsync(ActionPlanEntity plan)
    {
        var assignees = await _context.ActionPlanAssignees
            .AsNoTracking()
            .Where(x => x.ActionPlanId == plan.Id && !x.IsDeleted && x.IsActived)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        var planAttachments = await _context.ActionPlanAttachments
            .AsNoTracking()
            .Where(x => x.RelatedId == plan.Id && !x.IsDeleted && x.IsActived)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        var tasks = await _context.ActionTasks
            .AsNoTracking()
            .Where(x => x.ActionPlanId == plan.Id && !x.IsDeleted && x.IsActived)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();

        var assigneeUsers = await LoadUsersAsync(assignees.Select(x => x.UserId));
        var taskIds = tasks.Select(x => x.Id).ToList();

        var taskAttachmentList = taskIds.Count == 0
            ? new List<ActionTaskAttachment>()
            : await _context.ActionTaskAttachments
                .AsNoTracking()
                .Where(x => taskIds.Contains(x.ActionTaskId) && !x.IsDeleted && x.IsActived)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

        var taskAttachmentGroups = taskAttachmentList
            .GroupBy(x => x.ActionTaskId)
            .ToDictionary(x => x.Key, x => x.ToList());

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
            Status = plan.Status,
            SourceFindingId = plan.SourceFindingId,
            CompletedAt = plan.CompletedAt,
            CompletedBy = plan.CompletedBy,
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
            Attachments = planAttachments.Select(x => _mapper.Map<ModelAttachment>(x)).ToList(),
            Tasks = tasks.Select(x =>
            {
                taskAttachmentGroups.TryGetValue(x.Id, out var xAttachments);
                return new ActionTaskDto
                {
                    Id = x.Id,
                    ActionPlanId = x.ActionPlanId,
                    Description = x.Description,
                    Note = x.Note,
                    TaskStatus = x.TaskStatus,
                    DueDate = x.DueDate,
                    CompletedAt = x.CompletedAt,
                    CreatedBy = x.CreatedBy,
                    Attachments = (xAttachments ?? new List<ActionTaskAttachment>()).Select(a => new ActionTaskAttachmentDto
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

    private async Task<Dictionary<Guid, MetadataBundle>> BuildMetadataByStandardSetAsync(IEnumerable<Guid> standardSetIds)
    {
        var result = new Dictionary<Guid, MetadataBundle>();

        foreach (var standardSetId in standardSetIds.Distinct())
        {
            try
            {
                var standards = new Dictionary<Guid, (string Code, string Name)>();
                var criteria = new Dictionary<Guid, (string Code, string Name)>();

                await foreach (var row in _catalogService.GetStandardsWithCriteriaStreamAsync(
                    new GetStandardsWithCriteriaStreamRequest
                    {
                        StandardSetId = standardSetId.ToString()
                    }))
                {
                    standards[row.StandardId] = (row.StandardCode, row.StandardName);
                    criteria[row.CriterionId] = (row.CriterionCode, row.CriterionName);
                }

                result[standardSetId] = new MetadataBundle(standards, criteria);
            }
            catch (BusinessException)
            {
                // Giữ API sẵn sàng ngay cả khi CatalogService tạm thời không thể enrich metadata.
                result[standardSetId] = new MetadataBundle(
                    new Dictionary<Guid, (string Code, string Name)>(),
                    new Dictionary<Guid, (string Code, string Name)>());
            }
        }

        return result;
    }

    private static string? NormalizeText(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string GetStatusName(int status)
    {
        return status switch
        {
            (int)ActionPlanStatus.Draft => "Nháp",
            (int)ActionPlanStatus.InProgress => "Đang thực hiện",
            (int)ActionPlanStatus.PendingReview => "Chờ xác nhận",
            (int)ActionPlanStatus.Completed => "Hoàn thành",
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

    private sealed record MetadataBundle(
        Dictionary<Guid, (string Code, string Name)> Standards,
        Dictionary<Guid, (string Code, string Name)> Criteria);
}
