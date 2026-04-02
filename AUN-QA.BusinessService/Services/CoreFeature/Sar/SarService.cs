using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar
{
    [RegisterClassAsTransient]
    public class SarService : ISarService
    {
        private readonly BusinessContext _context;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ICycleService _cycleService;
        private readonly SystemProto.SystemProtoClient _systemClient;

        public SarService(
            BusinessContext context,
            IHttpContextAccessor contextAccessor,
            ICycleService cycleService,
            SystemProto.SystemProtoClient systemClient)
        {
            _context = context;
            _contextAccessor = contextAccessor;
            _cycleService = cycleService;
            _systemClient = systemClient;
        }

        public async Task<GetListPagingResponse<SarGetListItemDto>> GetList(SarGetListPagingRequest request)
        {
            var cycleQuery = _context.Cycles
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActived);

            if (!string.IsNullOrWhiteSpace(request.TextSearch))
            {
                var text = request.TextSearch.Trim();
                cycleQuery = cycleQuery.Where(x => x.Name.Contains(text));
            }

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

                var allowedRoles = Roles(
                    CouncilRole.HeadOfCouncil,
                    CouncilRole.ViceChairman,
                    CouncilRole.Secretary,
                    CouncilRole.Evaluator);

                var cycleIdsByPermission = _context.Councils
                    .Where(x => x.UserId == userId.Value
                        && !x.IsDeleted
                        && x.IsActived
                        && allowedRoles.Contains(x.RoleId))
                    .Select(x => x.CycleId);

                cycleQuery = cycleQuery.Where(x => cycleIdsByPermission.Contains(x.Id));
            }

            if (request.Status.HasValue)
            {
                var status = request.Status.Value;
                cycleQuery = cycleQuery.Where(c => _context.SarReports.Any(sr =>
                    sr.CycleId == c.Id &&
                    !sr.IsDeleted &&
                    sr.IsActived &&
                    sr.Status == status));
            }

            if (request.CycleId.HasValue)
            {
                cycleQuery = cycleQuery.Where(x => x.Id == request.CycleId.Value);
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

            var items = pageCycles.Select(cycle =>
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
            }).ToList();

            var usernames = items
                .Where(x => !string.IsNullOrEmpty(x.UpdatedBy))
                .Select(x => x.UpdatedBy!)
                .Distinct()
                .ToList();

            if (usernames.Count > 0)
            {
                try
                {
                    var grpcRequest = new GetUsersByUsernamesRequest();
                    grpcRequest.Usernames.AddRange(usernames);
                    var grpcResponse = await _systemClient.GetUsersByUsernamesAsync(grpcRequest);
                    var usernameToFullname = grpcResponse.Users
                        .ToDictionary(u => u.Username, u => u.Fullname);

                    foreach (var item in items)
                    {
                        if (!string.IsNullOrEmpty(item.UpdatedBy)
                            && usernameToFullname.TryGetValue(item.UpdatedBy, out var fullname)
                            && !string.IsNullOrWhiteSpace(fullname))
                        {
                            item.UpdatedBy = fullname;
                        }
                    }
                }
                catch
                {
                    // Fallback: keep username as-is.
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

        public async Task<SarDraftDto?> GetByCycle(GetSarByCycleRequest request)
        {
            await CheckPdcaPermissionAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator));

            await CheckCycleStageAsync(request.CycleId);

            var report = await EnsureSarReportAsync(request.CycleId);
            return ToDto(report);
        }

        public async Task SaveDraft(SaveSarDraftRequest request)
        {
            await CheckCycleStageAsync(request.CycleId);
            var council = await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator));

            var report = await EnsureSarReportAsync(request.CycleId);
            if (!SarWorkflowPolicy.CanSaveDraft(report.Status))
            {
                throw new BusinessException("SAR is not in a valid state for save draft");
            }

            if (council != null
                && council.RoleId == (int)CouncilRole.Evaluator
                && !SarWorkflowPolicy.HasValidEvaluatorScope(council.AssignedStandards))
            {
                throw new BusinessException("Evaluator does not have a valid assigned standards scope");
            }

            report.YdocSnapshot = DecodeBase64(request.YDocSnapshotBase64);
            report.RenderedHtml = request.RenderedHtml;
            report.LastSavedAt = DateTime.UtcNow;
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = GetDisplayName();

            _context.SarReports.Update(report);
            await _context.SaveChangesAsync();
        }

        public async Task Submit(SubmitSarRequest request)
        {
            await CheckCycleStageAsync(request.CycleId);
            await RequireCouncilRoleAsync(request.CycleId, Roles(CouncilRole.Secretary));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            if (!SarWorkflowPolicy.CanSubmit(report.Status))
            {
                throw new BusinessException("SAR is not in a valid state for submit");
            }

            report.Status = (int)SarStatus.Submitted;
            report.SubmittedAt = DateTime.UtcNow;
            report.SubmittedBy = GetDisplayName();
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = GetDisplayName();

            _context.SarReports.Update(report);
            await _context.SaveChangesAsync();
        }

        public async Task RequestRevision(RequestSarRevisionRequest request)
        {
            await CheckCycleCheckStageAsync(request.CycleId);
            var council = await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Evaluator));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            if (!SarWorkflowPolicy.CanRequestRevision(report.Status))
            {
                throw new BusinessException("SAR is not in a valid state for request revision");
            }

            if (council == null && !IsAdmin())
            {
                throw new BusinessException("You do not have permission to request SAR revision");
            }

            report.Status = (int)SarStatus.RevisionRequested;
            report.RevisionRequestedAt = DateTime.UtcNow;
            report.RevisionRequestedBy = GetDisplayName();
            report.RevisionReason = request.RevisionReason.Trim();
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = GetDisplayName();

            _context.SarReports.Update(report);
            await _context.SaveChangesAsync();
        }

        public async Task Approve(ApproveSarRequest request)
        {
            await CheckCycleCheckStageAsync(request.CycleId);
            var council = await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            if (!SarWorkflowPolicy.CanApprove(report.Status))
            {
                throw new BusinessException("SAR is not in a valid state for approve");
            }

            if (council == null && !IsAdmin())
            {
                throw new BusinessException("You do not have permission to approve SAR");
            }

            if (council != null && !SarWorkflowPolicy.CanApprove(council))
            {
                throw new BusinessException("Vice chairman requires active delegation to approve SAR");
            }

            report.Status = (int)SarStatus.Approved;
            report.ApprovedAt = DateTime.UtcNow;
            report.ApprovedBy = GetDisplayName();
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = GetDisplayName();

            _context.SarReports.Update(report);
            await _context.SaveChangesAsync();
        }

        public async Task<List<SarFeedbackDto>> GetFeedbacks(GetSarFeedbackRequest request)
        {
            await CheckCycleCheckStageAsync(request.CycleId);
            await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            var query = _context.SarReviewComments
                .AsNoTracking()
                .Where(x => x.SarReportId == report.Id && !x.IsDeleted && x.IsActived);

            if (!string.IsNullOrWhiteSpace(request.CriterionCode))
            {
                var criterionCode = request.CriterionCode.Trim();
                query = query.Where(x => x.CriterionCode == criterionCode);
            }

            if (request.CommentType.HasValue)
            {
                query = query.Where(x => x.CommentType == request.CommentType.Value);
            }

            var comments = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return comments.Select(x => new SarFeedbackDto
            {
                Id = x.Id,
                SarReportId = x.SarReportId,
                CycleId = report.CycleId,
                CriterionCode = x.CriterionCode,
                CommentText = x.CommentText,
                CommentType = x.CommentType,
                RoleId = x.RoleId,
                IsResolved = x.IsResolved,
                ResolvedAt = x.ResolvedAt,
                ResolvedBy = x.ResolvedBy,
                CreatedAt = x.CreatedAt,
                CreatedBy = x.CreatedBy,
                UpdatedAt = x.UpdatedAt,
                UpdatedBy = x.UpdatedBy
            }).ToList();
        }

        public async Task AddFeedback(AddSarFeedbackRequest request)
        {
            await CheckCycleCheckStageAsync(request.CycleId);
            var council = await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            if (report.Status == (int)SarStatus.Approved)
            {
                throw new BusinessException("SAR is approved and read-only");
            }

            if (string.IsNullOrWhiteSpace(request.CommentText))
            {
                throw new BusinessException("Comment text is required");
            }

            var now = DateTime.UtcNow;
            var comment = new SarReviewComment
            {
                Id = Guid.NewGuid(),
                SarReportId = report.Id,
                CriterionCode = string.IsNullOrWhiteSpace(request.CriterionCode) ? null : request.CriterionCode.Trim(),
                CommentText = request.CommentText.Trim(),
                CommentType = request.CommentType,
                RoleId = council?.RoleId,
                IsResolved = false,
                CreatedAt = now,
                CreatedBy = GetDisplayName(),
                IsActived = true,
                IsDeleted = false
            };

            await _context.SarReviewComments.AddAsync(comment);
            await _context.SaveChangesAsync();
        }

        private async Task<SarReport> EnsureSarReportAsync(Guid cycleId)
        {
            var cycleExists = await _context.Cycles
                .AsNoTracking()
                .AnyAsync(x => x.Id == cycleId && !x.IsDeleted && x.IsActived);

            if (!cycleExists)
            {
                throw new BusinessException("Cycle does not exist");
            }

            var report = await _context.SarReports
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);

            if (report != null)
            {
                return report;
            }

            report = new SarReport
            {
                Id = Guid.NewGuid(),
                CycleId = cycleId,
                Status = (int)SarStatus.Draft,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = CurrentUsername(),
                IsActived = true,
                IsDeleted = false
            };

            await _context.SarReports.AddAsync(report);
            await _context.SaveChangesAsync();

            return report;
        }

        private async Task<SarReport> GetSarReportOrThrowAsync(Guid cycleId)
        {
            var report = await _context.SarReports
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);

            if (report == null)
            {
                throw new BusinessException("SAR report does not exist for this cycle");
            }

            return report;
        }

        private string GetDisplayName() => CurrentUsername();

        private async Task<Council?> RequireCouncilRoleAsync(Guid cycleId, List<int>? allowedRoles = null)
        {
            if (IsAdmin())
            {
                return null;
            }

            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                throw new BusinessException("Cannot determine current user");
            }

            var council = await _context.Councils.AsNoTracking().FirstOrDefaultAsync(x =>
                x.CycleId == cycleId
                && x.UserId == userId.Value
                && !x.IsDeleted
                && x.IsActived);

            if (council == null)
            {
                throw new BusinessException("You do not have permission to perform this action in this PDCA cycle");
            }

            if (allowedRoles != null && allowedRoles.Count > 0 && !allowedRoles.Contains(council.RoleId))
            {
                throw new BusinessException("You do not have permission to perform this action in this PDCA cycle");
            }

            return council;
        }

        private static SarDraftDto ToDto(SarReport report)
        {
            return new SarDraftDto
            {
                SarReportId = report.Id,
                CycleId = report.CycleId,
                Status = report.Status,
                YDocSnapshotBase64 = report.YdocSnapshot != null
                    ? Convert.ToBase64String(report.YdocSnapshot)
                    : null,
                RenderedHtml = report.RenderedHtml,
                LastSavedAt = report.LastSavedAt,
                CreatedAt = report.CreatedAt,
                CreatedBy = report.CreatedBy,
                UpdatedAt = report.UpdatedAt,
                UpdatedBy = report.UpdatedBy
            };
        }

        private static byte[]? DecodeBase64(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            try
            {
                return Convert.FromBase64String(value);
            }
            catch (FormatException)
            {
                throw new BusinessException("YDocSnapshotBase64 is invalid");
            }
        }

        private bool IsAdmin()
        {
            var username = _contextAccessor.HttpContext?.User?.Identity?.Name;
            return string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);
        }

        private string CurrentUsername()
        {
            return _contextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(x => x.Type == "unique_name")?.Value ?? "System";
        }

        private Guid? GetCurrentUserIdOrNull()
        {
            var userId = _contextAccessor.HttpContext?.User?.Claims
                .FirstOrDefault(x => x.Type == "name")?.Value;

            if (Guid.TryParse(userId, out var parsed))
            {
                return parsed;
            }

            return null;
        }

        private async Task CheckPdcaPermissionAsync(Guid cycleId, List<int>? allowedRoles = null)
        {
            if (IsAdmin())
            {
                return;
            }

            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                throw new BusinessException("Cannot determine current user");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = allowedRoles
            });

            if (!allowed)
            {
                throw new BusinessException("You do not have permission to perform this action in this PDCA cycle");
            }
        }

        private async Task CheckCycleStageAsync(Guid cycleId)
        {
            var (found, status) = await _cycleService.GetCycleStatusAsync(cycleId);
            if (!found)
            {
                throw new BusinessException("Cycle does not exist");
            }

            if (status == (int)CycleStatus.Do)
            {
                return;
            }

            if (IsAdmin())
            {
                return;
            }

            var userId = GetCurrentUserIdOrNull();
            if (userId == null)
            {
                throw new BusinessException("Cycle is not in Do stage and user cannot perform this action");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman)
            });

            if (!allowed)
            {
                throw new BusinessException("Cycle is not in Do stage and user cannot perform this action");
            }
        }

        private async Task CheckCycleCheckStageAsync(Guid cycleId)
        {
            var (found, status) = await _cycleService.GetCycleStatusAsync(cycleId);
            if (!found)
            {
                throw new BusinessException("Cycle does not exist");
            }

            if (status == (int)CycleStatus.Check)
            {
                return;
            }

            if (IsAdmin())
            {
                return;
            }

            throw new BusinessException("Workflow action requires cycle in Check stage");
        }

        private static List<int> Roles(params CouncilRole[] roles)
        {
            return roles.Select(x => (int)x).ToList();
        }
    }
}
