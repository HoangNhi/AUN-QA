using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.Shared.Exceptions;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.InternalReview
{
    [RegisterClassAsTransient]
    public class InternalReviewService : IInternalReviewService
    {
        private static readonly int[] AllowedCouncilRoles =
        {
            (int)CouncilRole.HeadOfCouncil,
            (int)CouncilRole.ViceChairman,
            (int)CouncilRole.Secretary,
            (int)CouncilRole.Evaluator,
            (int)CouncilRole.EvidenceProvider
        };

        private readonly BusinessContext _context;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly SystemProto.SystemProtoClient _systemClient;

        public InternalReviewService(
            BusinessContext context,
            IHttpContextAccessor contextAccessor,
            SystemProto.SystemProtoClient systemClient)
        {
            _context = context;
            _contextAccessor = contextAccessor;
            _systemClient = systemClient;
        }

        public async Task<GetListPagingResponse<SarGetListItemDto>> GetList(SarGetListPagingRequest request)
        {
            var cycleQuery = _context.Cycles
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActived && x.Status == (int)CycleStatus.Check);

            if (!IsAdmin())
            {
                var userId = GetCurrentUserIdOrNull();
                if (userId == null)
                {
                    return new GetListPagingResponse<SarGetListItemDto>
                    {
                        PageIndex = request.PageIndex,
                        PageSize = request.PageSize,
                        TotalRow = 0,
                        Data = new List<SarGetListItemDto>()
                    };
                }

                var cycleIdsByPermission = _context.Councils
                    .AsNoTracking()
                    .Where(x =>
                        x.UserId == userId.Value &&
                        !x.IsDeleted &&
                        x.IsActived &&
                        AllowedCouncilRoles.Contains(x.RoleId))
                    .Select(x => x.CycleId);

                cycleQuery = cycleQuery.Where(x => cycleIdsByPermission.Contains(x.Id));
            }

            if (!string.IsNullOrWhiteSpace(request.TextSearch))
            {
                var text = request.TextSearch.Trim();
                cycleQuery = cycleQuery.Where(x => x.Name.Contains(text));
            }

            if (request.CycleId.HasValue)
            {
                cycleQuery = cycleQuery.Where(x => x.Id == request.CycleId.Value);
            }

            var draftStatus = (int)SarStatus.Draft;
            cycleQuery = cycleQuery.Where(c =>
                _context.SarReports
                    .Where(sr =>
                        sr.CycleId == c.Id &&
                        !sr.IsDeleted &&
                        sr.IsActived)
                    .OrderByDescending(sr => sr.UpdatedAt ?? sr.LastSavedAt ?? sr.CreatedAt)
                    .Take(1)
                    .Any(sr => sr.Status != draftStatus));

            if (request.Status.HasValue)
            {
                var status = request.Status.Value;
                cycleQuery = cycleQuery.Where(c =>
                    _context.SarReports
                        .Where(sr =>
                            sr.CycleId == c.Id &&
                            !sr.IsDeleted &&
                            sr.IsActived)
                        .OrderByDescending(sr => sr.UpdatedAt ?? sr.LastSavedAt ?? sr.CreatedAt)
                        .Take(1)
                        .Any(sr => sr.Status == status));
            }

            var totalRow = await cycleQuery.CountAsync();

            var pageCycles = await cycleQuery
                .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var cycleIds = pageCycles.Select(x => x.Id).ToList();
            var sarReports = await _context.SarReports
                .AsNoTracking()
                .Where(x => cycleIds.Contains(x.CycleId) && !x.IsDeleted && x.IsActived)
                .ToListAsync();

            var reportByCycle = sarReports
                .GroupBy(x => x.CycleId)
                .ToDictionary(
                    g => g.Key,
                    g => g
                        .OrderByDescending(x => x.UpdatedAt ?? x.LastSavedAt ?? x.CreatedAt)
                        .First());

            var items = pageCycles
                .Select(cycle =>
                {
                    reportByCycle.TryGetValue(cycle.Id, out var report);

                    return new SarGetListItemDto
                    {
                        SarReportId = report?.Id ?? Guid.Empty,
                        CycleId = cycle.Id,
                        CycleName = cycle.Name,
                        Year = cycle.Year,
                        Status = report?.Status ?? (int)SarStatus.Draft,
                        LastSavedAt = report?.LastSavedAt,
                        UpdatedAt = report?.UpdatedAt,
                        UpdatedBy = report?.UpdatedBy,
                        EvaluationPurpose = cycle.EvaluationPurpose
                    };
                })
                .ToList();

            var usernames = items
                .Where(x => !string.IsNullOrWhiteSpace(x.UpdatedBy))
                .Select(x => x.UpdatedBy!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (usernames.Count > 0)
            {
                try
                {
                    var grpcRequest = new GetUsersByUsernamesRequest();
                    grpcRequest.Usernames.AddRange(usernames);
                    var grpcResponse = await _systemClient.GetUsersByUsernamesAsync(grpcRequest);
                    var usernameToFullname = grpcResponse.Users
                        .Where(x => !string.IsNullOrWhiteSpace(x.Username) && !string.IsNullOrWhiteSpace(x.Fullname))
                        .ToDictionary(
                            x => x.Username.Trim(),
                            x => x.Fullname.Trim(),
                            StringComparer.OrdinalIgnoreCase);

                    foreach (var item in items)
                    {
                        if (!string.IsNullOrWhiteSpace(item.UpdatedBy)
                            && usernameToFullname.TryGetValue(item.UpdatedBy, out var fullname)
                            && !string.IsNullOrWhiteSpace(fullname))
                        {
                            item.UpdatedBy = fullname;
                        }
                    }
                }
                catch
                {
                    // Keep usernames if fullname enrichment fails.
                }
            }

            return new GetListPagingResponse<SarGetListItemDto>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = items
            };
        }

        public async Task<List<InternalCommentDto>> GetComments(GetInternalCommentsRequest request)
        {
            var accessContext = await ValidateReviewAccessAsync(request.CycleId);
            var reviewRound = request.ReviewRound ?? accessContext.SarReport.ReviewRound;

            var query = _context.InternalComments
                .AsNoTracking()
                .Where(x =>
                    x.SarReportId == accessContext.SarReport.Id &&
                    x.ReviewRound == reviewRound &&
                    !x.IsDeleted &&
                    x.IsActived);

            if (accessContext.CouncilRoleId == (int)CouncilRole.EvidenceProvider)
            {
                query = query.Where(x => x.CreatedBy == accessContext.Username);
            }

            var comments = await query
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var userMap = await FetchFullNamesByUsernamesAsync(comments.Select(x => x.CreatedBy));

            return comments
                .Select(x =>
                {
                    var createdByInfo = userMap.TryGetValue(x.CreatedBy, out var info)
                        ? info
                        : (FullName: x.CreatedBy, Avatar: (string?)null);
                    return ToDto(x, createdByInfo.FullName, createdByInfo.Avatar);
                })
                .ToList();
        }

        public async Task<InternalCommentDto> AddComment(AddInternalCommentRequest request)
        {
            var commentText = request.CommentText?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(commentText))
            {
                throw new BusinessException("Nội dung nhận xét không được để trống");
            }

            var accessContext = await ValidateReviewAccessAsync(request.CycleId);
            var username = GetCurrentUsernameOrThrow();
            var now = DateTime.UtcNow;

            var comment = new InternalComment
            {
                Id = Guid.NewGuid(),
                SarReportId = accessContext.SarReport.Id,
                CommentText = commentText,
                HighlightedText = NormalizeOptionalText(request.HighlightedText),
                CommentMarkId = NormalizeOptionalText(request.CommentMarkId),
                ReviewRound = accessContext.SarReport.ReviewRound,
                CreatedAt = now,
                CreatedBy = username,
                UpdatedAt = now,
                UpdatedBy = username,
                IsActived = true,
                IsDeleted = false
            };

            await _context.InternalComments.AddAsync(comment);
            await _context.SaveChangesAsync();

            var userMap = await FetchFullNamesByUsernamesAsync(new[] { username });
            var createdByInfo = userMap.TryGetValue(username, out var info)
                ? info
                : (FullName: username, Avatar: (string?)null);
            return ToDto(
                comment,
                createdByInfo.FullName,
                createdByInfo.Avatar);
        }

        public async Task DeleteComment(DeleteInternalCommentRequest request)
        {
            var username = GetCurrentUsernameOrThrow();

            var comment = await _context.InternalComments
                .Include(x => x.SarReport)
                .FirstOrDefaultAsync(x => x.Id == request.CommentId && !x.IsDeleted && x.IsActived);

            if (comment == null)
            {
                throw new BusinessException("Nhận xét nội bộ không tồn tại");
            }

            if (!string.Equals(comment.CreatedBy, username, StringComparison.OrdinalIgnoreCase))
            {
                throw new BusinessException("Bạn chỉ có thể xóa nhận xét của chính mình");
            }

            if (comment.SarReport == null || comment.SarReport.IsDeleted || !comment.SarReport.IsActived)
            {
                throw new BusinessException("Báo cáo TĐG không tồn tại trong chu kỳ này");
            }

            if (comment.SarReport.Status != (int)SarStatus.Submitted)
            {
                throw new BusinessException("Chỉ có thể xóa nhận xét khi SAR đang ở trạng thái Đã nộp");
            }

            comment.IsDeleted = true;
            comment.IsActived = false;
            comment.UpdatedAt = DateTime.UtcNow;
            comment.UpdatedBy = username;

            await _context.SaveChangesAsync();
        }

        private async Task<ReviewAccessContext> ValidateReviewAccessAsync(Guid cycleId)
        {
            var cycle = await _context.Cycles
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == cycleId && !x.IsDeleted && x.IsActived);

            if (cycle == null)
            {
                throw new BusinessException("Chu kỳ không tồn tại");
            }

            if (cycle.Status != (int)CycleStatus.Check)
            {
                throw new BusinessException("Nhận xét nội bộ chỉ khả dụng khi chu kỳ đang ở pha Kiểm tra (CHECK)");
            }

            var sarReport = await _context.SarReports
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);

            if (sarReport == null)
            {
                throw new BusinessException("Báo cáo TĐG không tồn tại trong chu kỳ này");
            }

            if (sarReport.Status != (int)SarStatus.Submitted)
            {
                throw new BusinessException("Nhận xét nội bộ chỉ khả dụng khi SAR đang ở trạng thái Đã nộp");
            }

            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                throw new BusinessException("Không thể xác định người dùng hiện tại");
            }

            var council = await _context.Councils
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.CycleId == cycleId &&
                    x.UserId == userId.Value &&
                    !x.IsDeleted &&
                    x.IsActived);

            if (council == null || !AllowedCouncilRoles.Contains(council.RoleId))
            {
                throw new BusinessException("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA này");
            }

            return new ReviewAccessContext
            {
                Username = GetCurrentUsernameOrThrow(),
                CouncilRoleId = council.RoleId,
                SarReport = sarReport
            };
        }

        private Guid? GetCurrentUserIdOrNull()
        {
            var userId = _contextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(x => x.Type == "name")?.Value;

            return Guid.TryParse(userId, out var parsed) ? parsed : null;
        }

        private bool IsAdmin()
        {
            var username = _contextAccessor.HttpContext?.User?.Identity?.Name;
            return string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);
        }

        private string GetCurrentUsernameOrThrow()
        {
            var username = _contextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(x => x.Type == "unique_name")?.Value;

            if (string.IsNullOrWhiteSpace(username))
            {
                username = _contextAccessor.HttpContext?.User?.Identity?.Name;
            }

            if (string.IsNullOrWhiteSpace(username))
            {
                throw new BusinessException("Không thể xác định người dùng hiện tại");
            }

            return username.Trim();
        }

        private async Task<Dictionary<string, (string FullName, string? Avatar)>> FetchFullNamesByUsernamesAsync(IEnumerable<string> usernames)
        {
            var distinctUsernames = usernames
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (distinctUsernames.Count == 0)
            {
                return new Dictionary<string, (string FullName, string? Avatar)>(StringComparer.OrdinalIgnoreCase);
            }

            try
            {
                var grpcRequest = new GetUsersByUsernamesRequest();
                grpcRequest.Usernames.AddRange(distinctUsernames);
                var grpcResponse = await _systemClient.GetUsersByUsernamesAsync(grpcRequest);

                return grpcResponse.Users
                    .Where(x => !string.IsNullOrWhiteSpace(x.Username))
                    .ToDictionary(
                        x => x.Username.Trim(),
                        x => (
                            FullName: string.IsNullOrWhiteSpace(x.Fullname) ? x.Username.Trim() : x.Fullname.Trim(),
                            Avatar: string.IsNullOrWhiteSpace(x.Avatar) ? null : x.Avatar.Trim()),
                        StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                return new Dictionary<string, (string FullName, string? Avatar)>(StringComparer.OrdinalIgnoreCase);
            }
        }

        private static string? NormalizeOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static InternalCommentDto ToDto(InternalComment comment, string createdByName, string? createdByAvatar)
        {
            return new InternalCommentDto
            {
                Id = comment.Id,
                SarReportId = comment.SarReportId,
                CommentText = comment.CommentText,
                HighlightedText = comment.HighlightedText,
                CommentMarkId = comment.CommentMarkId,
                ReviewRound = comment.ReviewRound,
                CreatedAt = comment.CreatedAt,
                CreatedBy = comment.CreatedBy,
                CreatedByName = createdByName,
                CreatedByAvatar = createdByAvatar,
                UpdatedAt = comment.UpdatedAt,
                UpdatedBy = comment.UpdatedBy
            };
        }

        private sealed class ReviewAccessContext
        {
            public string Username { get; set; } = string.Empty;

            public int? CouncilRoleId { get; set; }

            public SarReport SarReport { get; set; } = null!;
        }
    }
}
