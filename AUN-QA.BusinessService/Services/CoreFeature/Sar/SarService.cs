using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
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
                    Status = report?.Status ?? 1,
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
                catch { /* Fallback: keep username as-is */ }
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
            await CheckPdcaPermissionAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator));

            await CheckCycleStageAsync(request.CycleId);

            var report = await EnsureSarReportAsync(request.CycleId);

            report.YdocSnapshot = DecodeBase64(request.YDocSnapshotBase64);
            report.RenderedHtml = request.RenderedHtml;
            report.LastSavedAt = DateTime.UtcNow;
            report.UpdatedAt = DateTime.UtcNow;
            report.UpdatedBy = GetDisplayName();

            _context.SarReports.Update(report);
            await _context.SaveChangesAsync();
        }

        private async Task<Entities.SarReport> EnsureSarReportAsync(Guid cycleId)
        {
            var cycleExists = await _context.Cycles
                .AsNoTracking()
                .AnyAsync(x => x.Id == cycleId && !x.IsDeleted && x.IsActived);

            if (!cycleExists)
            {
                throw new BusinessException("Chu kỳ không tồn tại");
            }

            var report = await _context.SarReports
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);

            if (report != null)
            {
                return report;
            }

            report = new Entities.SarReport
            {
                Id = Guid.NewGuid(),
                CycleId = cycleId,
                Status = 1,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = CurrentUsername(),
                IsActived = true,
                IsDeleted = false
            };

            await _context.SarReports.AddAsync(report);
            await _context.SaveChangesAsync();

            return report;
        }

        private string GetDisplayName() => CurrentUsername();

        private static SarDraftDto ToDto(Entities.SarReport report)
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
                throw new BusinessException("YDocSnapshotBase64 không hợp lệ");
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
                throw new BusinessException("Không xác định được người dùng hiện tại");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = allowedRoles
            });

            if (!allowed)
            {
                throw new BusinessException("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA");
            }
        }

        private async Task CheckCycleStageAsync(Guid cycleId)
        {
            var (found, status) = await _cycleService.GetCycleStatusAsync(cycleId);
            if (!found)
            {
                throw new BusinessException("Chu kỳ không tồn tại");
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
                throw new BusinessException("Chu kỳ chưa ở giai đoạn Thực hiện, bạn không có quyền thực hiện thao tác này");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman)
            });

            if (!allowed)
            {
                throw new BusinessException("Chu kỳ chưa ở giai đoạn Thực hiện, bạn không có quyền thực hiện thao tác này");
            }
        }

        private static List<int> Roles(params CouncilRole[] roles)
        {
            return roles.Select(x => (int)x).ToList();
        }
    }
}
