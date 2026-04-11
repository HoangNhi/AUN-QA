using System.Text;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.CatalogService.Protos;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration.Attributes;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Http;
using System.Net;
using System.Net.Http;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar
{
    [RegisterClassAsTransient]
    public class SarService : ISarService
    {
        private readonly BusinessContext _context;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ICycleService _cycleService;
        private readonly ICatalogIntegrationService _catalogService;
        private readonly SystemProto.SystemProtoClient _systemClient;
        private readonly IHttpClientFactory? _httpClientFactory;

        public SarService(
            BusinessContext context,
            IHttpContextAccessor contextAccessor,
            ICycleService cycleService,
            ICatalogIntegrationService catalogService,
            SystemProto.SystemProtoClient systemClient,
            IHttpClientFactory? httpClientFactory = null)
        {
            _context = context;
            _contextAccessor = contextAccessor;
            _cycleService = cycleService;
            _catalogService = catalogService;
            _systemClient = systemClient;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<GetListPagingResponse<SarGetListItemDto>> GetList(SarGetListPagingRequest request)
        {
            var cycleQuery = _context.Cycles
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActived
                    && (x.Status == (int)CycleStatus.Do
                        || x.Status == (int)CycleStatus.Check
                        || x.Status == (int)CycleStatus.Act));

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
                    CouncilRole.Evaluator,
                    CouncilRole.EvidenceProvider);

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

            if (request.ExcludeDraft == true)
            {
                var draftStatus = (int)SarStatus.Draft;
                cycleQuery = cycleQuery.Where(c => _context.SarReports
                    .Where(sr => sr.CycleId == c.Id && !sr.IsDeleted && sr.IsActived)
                    .OrderByDescending(sr => sr.UpdatedAt ?? sr.LastSavedAt ?? sr.CreatedAt)
                    .Take(1)
                    .Any(sr => sr.Status != draftStatus));
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
            var allowedRoles = Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator,
                CouncilRole.EvidenceProvider);

            await CheckPdcaPermissionAsync(request.CycleId, allowedRoles);

            await CheckCycleDoOrCheckStageAsync(request.CycleId);
            var council = await RequireCouncilRoleAsync(request.CycleId, allowedRoles);
            var canSubmitByRole = IsAdmin() || council?.RoleId == (int)CouncilRole.Secretary;
            var canEditByRole = IsAdmin() || (council != null && council.RoleId != (int)CouncilRole.EvidenceProvider);
            var canApproveByRole = IsAdmin() || (
                council != null && (
                    council.RoleId == (int)CouncilRole.HeadOfCouncil
                    || (council.RoleId == (int)CouncilRole.ViceChairman && SarWorkflowPolicy.IsDelegationActive(council))));

            var report = await EnsureSarReportAsync(request.CycleId);
            return ToDto(
                report,
                council?.RoleId,
                canSubmitByRole,
                canEditByRole,
                canApproveByRole);
        }

        public async Task SaveDraft(SaveSarDraftRequest request)
        {
            var report = await FindSarReportAsync(request.CycleId);
            var currentStatus = report?.Status ?? (int)SarStatus.Draft;

            await CheckCycleStageForDraftOrRevisionAsync(request.CycleId, currentStatus);

            var council = await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman,
                CouncilRole.Secretary,
                CouncilRole.Evaluator));
            if (!SarWorkflowPolicy.CanSaveDraft(currentStatus))
            {
                throw new BusinessException("SAR không ở trạng thái hợp lệ để lưu bản nháp");
            }

            if (council != null
                && council.RoleId == (int)CouncilRole.Evaluator
                && !SarWorkflowPolicy.HasValidEvaluatorScope(council.AssignedStandards))
            {
                throw new BusinessException("Thành viên đánh giá không có phạm vi tiêu chuẩn được phân công hợp lệ");
            }

            report ??= await EnsureSarReportAsync(request.CycleId);
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
            await RequireCouncilRoleAsync(request.CycleId, Roles(CouncilRole.Secretary));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            if (!SarWorkflowPolicy.CanSubmit(report.Status))
            {
                throw new BusinessException("SAR không ở trạng thái hợp lệ để nộp");
            }

            await CheckCycleStageForDraftOrRevisionAsync(request.CycleId, report.Status);

            var now = DateTime.UtcNow;
            SarAuditTrail.SetTransitionPayload(
                _contextAccessor.HttpContext,
                SarAuditTrail.CreateTransitionPayload(
                    report.Status,
                    (int)SarStatus.Submitted,
                    "submit",
                    reason: null,
                    changedBy: GetDisplayName(),
                    changedAt: now));

            report.ReviewRound += 1;
            report.Status = (int)SarStatus.Submitted;
            report.SubmittedAt = now;
            report.SubmittedBy = GetDisplayName();
            report.UpdatedAt = now;
            report.UpdatedBy = GetDisplayName();

            var cycle = await _context.Cycles.FirstOrDefaultAsync(x =>
                x.Id == request.CycleId &&
                !x.IsDeleted &&
                x.IsActived);

            if (cycle == null)
            {
                throw new BusinessException("Chu kỳ không tồn tại hoặc không còn hoạt động");
            }

            if (cycle.Status == (int)CycleStatus.Do)
            {
                cycle.Status = (int)CycleStatus.Check;
                cycle.UpdatedAt = now;
                cycle.UpdatedBy = GetDisplayName();
            }

            await _context.SaveChangesAsync();
        }

        public async Task RequestRevision(RequestSarRevisionRequest request)
        {
            await CheckCycleCheckStageAsync(request.CycleId);
            var council = await RequireCouncilRoleAsync(request.CycleId, Roles(
                CouncilRole.HeadOfCouncil,
                CouncilRole.ViceChairman));

            var report = await GetSarReportOrThrowAsync(request.CycleId);
            if (!SarWorkflowPolicy.CanRequestRevision(report.Status))
            {
                throw new BusinessException("SAR không ở trạng thái hợp lệ để yêu cầu chỉnh sửa");
            }

            if (council == null && !IsAdmin())
            {
                throw new BusinessException("Bạn không có quyền yêu cầu chỉnh sửa SAR");
            }

            var now = DateTime.UtcNow;
            SarAuditTrail.SetTransitionPayload(
                _contextAccessor.HttpContext,
                SarAuditTrail.CreateTransitionPayload(
                    report.Status,
                    (int)SarStatus.RevisionRequested,
                    "request-revision",
                    request.RevisionReason.Trim(),
                    changedBy: GetDisplayName(),
                    changedAt: now));

            report.Status = (int)SarStatus.RevisionRequested;
            report.RevisionRequestedAt = now;
            report.RevisionRequestedBy = GetDisplayName();
            report.RevisionReason = request.RevisionReason.Trim();
            report.UpdatedAt = now;
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
                throw new BusinessException("SAR không ở trạng thái hợp lệ để phê duyệt");
            }

            if (council == null && !IsAdmin())
            {
                throw new BusinessException("Bạn không có quyền phê duyệt SAR");
            }

            if (council != null && !SarWorkflowPolicy.CanApprove(council))
            {
                throw new BusinessException("Phó Chủ tịch cần được ủy quyền đang hoạt động để phê duyệt SAR");
            }

            var now = DateTime.UtcNow;
            SarAuditTrail.SetTransitionPayload(
                _contextAccessor.HttpContext,
                SarAuditTrail.CreateTransitionPayload(
                    report.Status,
                    (int)SarStatus.Approved,
                    "approve",
                    reason: null,
                    changedBy: GetDisplayName(),
                    changedAt: now));

            report.Status = (int)SarStatus.Approved;
            report.ApprovedAt = now;
            report.ApprovedBy = GetDisplayName();
            report.UpdatedAt = now;
            report.UpdatedBy = GetDisplayName();

            _context.SarReports.Update(report);
            await _context.SaveChangesAsync();
        }

        private async Task<SarReport> EnsureSarReportAsync(Guid cycleId)
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

        private async Task<SarReport?> FindSarReportAsync(Guid cycleId)
        {
            return await _context.SarReports
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);
        }

        private async Task<SarReport> GetSarReportOrThrowAsync(Guid cycleId)
        {
            var report = await _context.SarReports
                .FirstOrDefaultAsync(x => x.CycleId == cycleId && !x.IsDeleted && x.IsActived);

            if (report == null)
            {
                throw new BusinessException("Báo cáo TĐG không tồn tại trong chu kỳ này");
            }

            return report;
        }

        private async Task CheckCycleStageForDraftOrRevisionAsync(Guid cycleId, int currentStatus)
        {
            if (currentStatus == (int)SarStatus.RevisionRequested)
            {
                await CheckCycleCheckStageAsync(cycleId);
                return;
            }

            await CheckCycleStageAsync(cycleId);
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
                throw new BusinessException("Không thể xác định người dùng hiện tại");
            }

            var council = await _context.Councils.AsNoTracking().FirstOrDefaultAsync(x =>
                x.CycleId == cycleId
                && x.UserId == userId.Value
                && !x.IsDeleted
                && x.IsActived);

            if (council == null)
            {
                throw new BusinessException("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA này");
            }

            if (allowedRoles != null && allowedRoles.Count > 0 && !allowedRoles.Contains(council.RoleId))
            {
                throw new BusinessException("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA này");
            }

            return council;
        }

        private static SarDraftDto ToDto(
            SarReport report,
            int? currentUserCouncilRoleId,
            bool canSubmitByRole,
            bool canEditByRole,
            bool canApproveByRole)
        {
            return new SarDraftDto
            {
                SarReportId = report.Id,
                CycleId = report.CycleId,
                Status = report.Status,
                ReviewRound = report.ReviewRound,
                CurrentUserCouncilRoleId = currentUserCouncilRoleId,
                CanSubmitByRole = canSubmitByRole,
                CanEditByRole = canEditByRole,
                CanApproveByRole = canApproveByRole,
                YDocSnapshotBase64 = report.YdocSnapshot != null
                    ? Convert.ToBase64String(report.YdocSnapshot)
                    : null,
                RenderedHtml = report.RenderedHtml,
                RevisionReason = report.RevisionReason,
                SubmittedAt = report.SubmittedAt,
                SubmittedBy = report.SubmittedBy,
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
                throw new BusinessException("Nội dung tài liệu không hợp lệ");
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
                throw new BusinessException("Không thể xác định người dùng hiện tại");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = allowedRoles
            });

            if (!allowed)
            {
                throw new BusinessException("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA này");
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
                throw new BusinessException("Chu kỳ không ở pha Do, người dùng không thể thực hiện thao tác này");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman)
            });

            if (!allowed)
            {
                throw new BusinessException("Chu kỳ không ở pha Do, người dùng không thể thực hiện thao tác này");
            }
        }

        private async Task CheckCycleDoOrCheckStageAsync(Guid cycleId)
        {
            var (found, status) = await _cycleService.GetCycleStatusAsync(cycleId);
            if (!found)
            {
                throw new BusinessException("Chu kỳ không tồn tại");
            }

            if (status == (int)CycleStatus.Do || status == (int)CycleStatus.Check)
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
                throw new BusinessException("Chu kỳ không ở pha Do hoặc Check, người dùng không thể thực hiện thao tác này");
            }

            var allowed = await _cycleService.CanUserDoActionInPdcaAsync(new PdcaActionCheckRequest
            {
                CycleId = cycleId,
                UserId = userId.Value,
                AllowedRoles = Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman)
            });

            if (!allowed)
            {
                throw new BusinessException("Chu kỳ không ở pha Do hoặc Check, người dùng không thể thực hiện thao tác này");
            }
        }

        private async Task CheckCycleCheckStageAsync(Guid cycleId)
        {
            var (found, status) = await _cycleService.GetCycleStatusAsync(cycleId);
            if (!found)
            {
                throw new BusinessException("Chu kỳ không tồn tại");
            }

            if (status == (int)CycleStatus.Check)
            {
                return;
            }

            if (IsAdmin())
            {
                return;
            }

            throw new BusinessException("Thao tác này yêu cầu chu kỳ đang ở pha Kiểm tra (CHECK)");
        }

        public async Task<SarAutofillPayloadDto> GetAutofillPayload(GetSarAutofillPayloadRequest request)
        {
            var cycle = await _context.Cycles
                .AsNoTracking()
                .Where(x => x.Id == request.CycleId && !x.IsDeleted && x.IsActived)
                .Select(x => new { x.Id, x.StandardSetId })
                .FirstOrDefaultAsync();

            if (cycle == null)
            {
                throw new BusinessException("Chu kỳ không tồn tại");
            }

            var evaluations = await _context.CriterionEvaluations
                .AsNoTracking()
                .Where(x => x.CycleId == request.CycleId && !x.IsDeleted && x.IsActived)
                .ToListAsync();

            if (!evaluations.Any())
            {
                return new SarAutofillPayloadDto
                {
                    CycleId = request.CycleId,
                    Payload = "<h3>Gợi ý điền dữ liệu từ Phiếu Đánh Giá</h3><p>Chưa có dữ liệu đánh giá tiêu chí.</p>"
                };
            }

            var evalIds = evaluations.Select(x => x.Id).ToList();
            var submissions = await _context.EvaluationSubmissions
                .AsNoTracking()
                .Where(x => evalIds.Contains(x.CriterionEvaluationId) && !x.IsDeleted && x.IsActived)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();

            var evaluatorNames = await FetchEvaluatorNamesAsync(submissions);
            var approverNames = await FetchFullNamesByUsernamesAsync(
                evaluations.Select(x => x.ApprovedBy));
            var criterionMeta = await FetchCriterionMetaAsync(cycle.StandardSetId);
            var payload = BuildAutofillPayloadHtml(
                evaluations,
                submissions,
                criterionMeta,
                evaluatorNames,
                approverNames);

            return new SarAutofillPayloadDto
            {
                CycleId = request.CycleId,
                Payload = payload
            };
        }

        public async Task<byte[]> ExportDocx(ExportSarDocxRequest request)
        {
            var report = await GetSarReportOrThrowAsync(request.CycleId);

            using var mem = new MemoryStream();
            using (var wordDocument = WordprocessingDocument.Create(mem, WordprocessingDocumentType.Document, true))
            {
                var mainPart = wordDocument.AddMainDocumentPart();
                mainPart.Document = new Document(new Body());
                var body = mainPart.Document.Body!;

                if (!string.IsNullOrWhiteSpace(report.RenderedHtml))
                {
                    // Use AltChunk HTML import so Word can render rich content (paragraphs, lists, tables, etc.)
                    var partId = "SarHtmlPart";
                    var htmlPart = mainPart.AddAlternativeFormatImportPart(
                        AlternativeFormatImportPartType.Html,
                        partId);

                    var htmlToExport = report.RenderedHtml;
                    if (_httpClientFactory is not null)
                    {
                        using var httpClient = _httpClientFactory.CreateClient();
                        var httpRequest = _contextAccessor.HttpContext?.Request;
                        var serverBaseUrl = httpRequest is not null
                            ? $"{httpRequest.Scheme}://{httpRequest.Host}"
                            : string.Empty;

                        htmlToExport = await HtmlWordExportHelper.EmbedImagesAsBase64Async(
                            htmlToExport,
                            httpClient,
                            serverBaseUrl);
                    }

                    await using (var stream = htmlPart.GetStream(FileMode.Create, FileAccess.Write))
                    await using (var writer = new StreamWriter(stream, Encoding.UTF8))
                    {
                        await writer.WriteAsync(HtmlWordExportHelper.BuildExportHtmlDocument(
                            htmlToExport));
                    }

                    body.AppendChild(new AltChunk { Id = partId });
                }
                else
                {
                    body.AppendChild(new Paragraph(
                        new Run(new Text("No RenderedHtml content found for this SAR report."))
                    ));
                }

                wordDocument.Save();
            }

            return mem.ToArray();
        }

        private async Task<Dictionary<Guid, string>> FetchEvaluatorNamesAsync(IEnumerable<EvaluationSubmission> submissions)
        {
            var userIds = submissions
                .Select(x => x.EvaluatorId)
                .Distinct()
                .ToList();

            if (userIds.Count == 0)
            {
                return new Dictionary<Guid, string>();
            }

            try
            {
                var grpcRequest = new GetUsersByIdsRequest();
                grpcRequest.UserIds.AddRange(userIds.Select(x => x.ToString()));
                var grpcResponse = await _systemClient.GetUsersByIdsAsync(grpcRequest);

                return grpcResponse.Users
                    .Select(user =>
                    {
                        var parsed = Guid.TryParse(user.Id, out var userId);
                        var fullname = DecodeHtmlAndNormalize(user.Fullname);
                        return new { parsed, userId, fullname };
                    })
                    .Where(x => x.parsed && !string.IsNullOrWhiteSpace(x.fullname))
                    .ToDictionary(x => x.userId, x => x.fullname);
            }
            catch
            {
                return new Dictionary<Guid, string>();
            }
        }

        private async Task<Dictionary<string, string>> FetchFullNamesByUsernamesAsync(IEnumerable<string?> usernames)
        {
            var distinctUsernames = usernames
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x!.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (distinctUsernames.Count == 0)
            {
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            }

            try
            {
                var grpcRequest = new GetUsersByUsernamesRequest();
                grpcRequest.Usernames.AddRange(distinctUsernames);
                var grpcResponse = await _systemClient.GetUsersByUsernamesAsync(grpcRequest);

                return grpcResponse.Users
                    .Where(x => !string.IsNullOrWhiteSpace(x.Username) && !string.IsNullOrWhiteSpace(x.Fullname))
                    .ToDictionary(
                        x => x.Username.Trim(),
                        x => DecodeHtmlAndNormalize(x.Fullname),
                        StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            }
        }

        private async Task<Dictionary<Guid, StandardWithCriteriaDto>> FetchCriterionMetaAsync(Guid standardSetId)
        {
            var grpcRequest = new GetStandardsWithCriteriaStreamRequest
            {
                StandardSetId = standardSetId.ToString()
            };

            var result = new Dictionary<Guid, StandardWithCriteriaDto>();
            await foreach (var row in _catalogService.GetStandardsWithCriteriaStreamAsync(grpcRequest))
            {
                result.TryAdd(row.CriterionId, row);
            }

            return result;
        }

        internal static string BuildAutofillPayloadHtml(
            IEnumerable<Entities.CriterionEvaluation> evaluations,
            IEnumerable<EvaluationSubmission> submissions,
            IReadOnlyDictionary<Guid, StandardWithCriteriaDto> criterionMeta,
            IReadOnlyDictionary<Guid, string> evaluatorNames,
            IReadOnlyDictionary<string, string> approverNames)
        {
            var orderedEvaluations = evaluations
                .Where(x => !string.IsNullOrWhiteSpace(x.ApprovedBy))
                .OrderBy(x => criterionMeta.TryGetValue(x.CriterionId, out var meta) ? meta.StandardOrder : int.MaxValue)
                .ThenBy(x => criterionMeta.TryGetValue(x.CriterionId, out var meta) ? meta.CriterionOrder : int.MaxValue)
                .ThenBy(x => x.CreatedAt)
                .ToList();

            var sb = new StringBuilder();
            sb.AppendLine("<h3>Gợi ý điền dữ liệu từ Phiếu Đánh Giá</h3>");

            var sectionCount = 0;
            foreach (var eval in orderedEvaluations)
            {
                var hasFinalResult = !string.IsNullOrWhiteSpace(eval.OfficialCurrentState)
                    || !string.IsNullOrWhiteSpace(eval.OfficialStrengths)
                    || !string.IsNullOrWhiteSpace(eval.OfficialWeaknesses)
                    || !string.IsNullOrWhiteSpace(eval.OfficialActionPlan)
                    || eval.OfficialScore.HasValue
                    || eval.OfficialResult.HasValue;

                if (!hasFinalResult)
                {
                    continue;
                }

                var criterionCode = criterionMeta.TryGetValue(eval.CriterionId, out var criterion)
                    ? criterion.CriterionCode
                    : "N/A";
                var criterionName = criterionMeta.TryGetValue(eval.CriterionId, out criterion)
                    ? criterion.CriterionName
                    : "Không xác định";

                sectionCount += 1;
                sb.AppendLine($"<h4>{Encode(criterionCode)}. {Encode(criterionName)}</h4>");

                if (!string.IsNullOrWhiteSpace(eval.OfficialCurrentState))
                {
                    sb.AppendLine($"<p><strong>Mô tả:</strong> \"{Encode(NormalizeText(eval.OfficialCurrentState))}\"</p>");
                }

                if (!string.IsNullOrWhiteSpace(eval.OfficialStrengths))
                {
                    sb.AppendLine($"<p><strong>Điểm mạnh:</strong> \"{Encode(NormalizeText(eval.OfficialStrengths))}\"</p>");
                }

                if (!string.IsNullOrWhiteSpace(eval.OfficialWeaknesses))
                {
                    sb.AppendLine($"<p><strong>Điểm cần cải tiến:</strong> \"{Encode(NormalizeText(eval.OfficialWeaknesses))}\"</p>");
                }

                if (!string.IsNullOrWhiteSpace(eval.OfficialActionPlan))
                {
                    sb.AppendLine($"<p><strong>Kế hoạch hành động:</strong> \"{Encode(NormalizeText(eval.OfficialActionPlan))}\"</p>");
                }

                if (eval.OfficialScore.HasValue)
                {
                    var approverDisplayName = ResolveApproverDisplayName(eval.ApprovedBy, approverNames);
                    var approvedBySuffix = string.IsNullOrWhiteSpace(eval.ApprovedBy)
                        ? string.Empty
                        : $" (Bởi {Encode(approverDisplayName)})";
                    sb.AppendLine($"<p><strong>Điểm chốt:</strong> {eval.OfficialScore.Value}/7{approvedBySuffix}</p>");
                }
                else if (eval.OfficialResult.HasValue)
                {
                    var finalResultText = eval.OfficialResult.Value ? "Đạt" : "Không đạt";
                    var approverDisplayName = ResolveApproverDisplayName(eval.ApprovedBy, approverNames);
                    var approvedBySuffix = string.IsNullOrWhiteSpace(eval.ApprovedBy)
                        ? string.Empty
                        : $" (Bởi {Encode(approverDisplayName)})";
                    sb.AppendLine($"<p><strong>Điểm chốt:</strong> {finalResultText}{approvedBySuffix}</p>");
                }

                sb.AppendLine("<hr />");
            }

            if (sectionCount == 0)
            {
                sb.AppendLine("<p>Chưa có dữ liệu đánh giá đủ điều kiện để đổ tự động.</p>");
            }

            return sb.ToString();
        }

        private static string NormalizeText(string? value)
        {
            return value?.Trim() ?? string.Empty;
        }

        private static string ResolveApproverDisplayName(
            string? approvedBy,
            IReadOnlyDictionary<string, string> approverNames)
        {
            var normalized = DecodeHtmlAndNormalize(approvedBy);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return string.Empty;
            }

            return approverNames.TryGetValue(normalized, out var fullName)
                && !string.IsNullOrWhiteSpace(fullName)
                ? fullName
                : normalized;
        }

        private static string DecodeHtmlAndNormalize(string? value)
        {
            return WebUtility.HtmlDecode(value ?? string.Empty).Trim();
        }

        private static string Encode(string value)
        {
            return WebUtility
                .HtmlEncode(value)
                .Replace("\r\n", "<br/>", StringComparison.Ordinal)
                .Replace("\n", "<br/>", StringComparison.Ordinal);
        }

        private static List<int> Roles(params CouncilRole[] roles)
        {
            return roles.Select(x => (int)x).ToList();
        }
    }
}


