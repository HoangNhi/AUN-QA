using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Responses;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap
{
    /// <summary>
    /// Evidence Cycle Map Service
    ///
    /// Evidence Status Workflow:
    /// 1. Draft → Initial state for new/updated evidence
    /// 2. Pending → Submitted for review (cannot be edited)
    /// 3. Verified → Approved by reviewer (cannot be edited)
    /// 4. Rejected → Not approved, can be edited and resubmitted
    ///
    /// Edit Rules:
    /// - Draft/Rejected evidence can be edited
    /// - Pending/Verified evidence cannot be edited
    /// - Any edit resets status to Draft (requires re-approval)
    /// </summary>
    [RegisterClassAsTransient]
    public class EvidenceCycleMapService : IEvidenceCycleMapService
    {
        private readonly BusinessContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly IUploadFileService _uploadFileService;
        private readonly ICatalogIntegrationService _catalogService;

        public EvidenceCycleMapService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            IUploadFileService uploadFileService,
            ICatalogIntegrationService catalogService)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _uploadFileService = uploadFileService;
            _catalogService = catalogService;
        }

        #region PDCA - DO: EvidenceCycleMap
        public async Task<EvidenceCycleMapRequest> GetById(GetByIdRequest request)
        {
            var data = await _context.EvidenceCycleMaps.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.Evaluator, CouncilRole.EvidenceProvider));

            var result = _mapper.Map<EvidenceCycleMapRequest>(data);

            // Load Evidence details
            var evidence = await _context.Evidences.AsNoTracking().FirstOrDefaultAsync(x => x.Id == data.EvidenceId);
            if (evidence != null)
            {
                result.Evidence = _mapper.Map<EvidenceRequest>(evidence);
                result.Evidence.ListAttachment = await GetAllAttachmentAsync(evidence.Id);
            }

            return result;
        }

        public async Task InsertWithEvidence(EvidenceCycleMapRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            List<ModelAttachment> lstAttachment = new List<ModelAttachment>();

            try
            {
                await CheckCycleStageAsync(request.CycleId.ToString());
                await CheckPdcaPermissionAsync(request.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.EvidenceProvider));

                // Validate duplicate name or code
                var data = _context.Evidences.Where(x =>
                    (x.Name == request.Evidence.Name || x.Code == request.Evidence.Code)
                    && !x.IsDeleted
                );

                if (await data.AnyAsync())
                {
                    throw new Exception("Tên hoặc mã minh chứng đã tồn tại");
                }

                var add = _mapper.Map<Entities.Evidence>(request.Evidence);
                add.Id = Guid.NewGuid(); // Server-side ID generation only

                // Status Transition: New Evidence
                // - If request specifies Pending status → submit for review immediately
                // - Otherwise → start as Draft (default for new evidence)
                add.Status = request.Evidence.Status == ((int)EvidenceStatus.Pending) ? ((int)EvidenceStatus.Pending) : ((int)EvidenceStatus.Draft);

                add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                add.CreatedAt = DateTime.Now;
                await _context.Evidences.AddAsync(add);

                #region Thêm tài liệu đính kèm
                lstAttachment = await _uploadFileService.UploadDataAsync(add.Id.ToString(), "Evidence", request.FolderUpload);
                foreach (var attachment in lstAttachment)
                {
                    Entities.EvidenceAttachment addAttachment = _mapper.Map<Entities.EvidenceAttachment>(attachment);
                    addAttachment.Id = Guid.NewGuid(); // Server-side ID generation only
                    addAttachment.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                    addAttachment.CreatedAt = DateTime.Now;
                    addAttachment.IsActived = true;
                    addAttachment.IsDeleted = false;

                    await _context.EvidenceAttachments.AddAsync(addAttachment);
                }
                #endregion

                #region Thêm Evidence cycle map
                var cycleMapAdd = new Entities.EvidenceCycleMap
                {
                    Id = Guid.NewGuid(), // Server-side ID generation only
                    EvidenceId = add.Id,
                    CycleId = request.CycleId,
                    ReviewStatus = ((int)EvidenceCycleMapReviewStatus.NotStarted),
                    CreatedBy = add.CreatedBy,
                    CreatedAt = DateTime.Now,
                    IsActived = true,
                    IsDeleted = false
                };
                await _context.EvidenceCycleMaps.AddAsync(cycleMapAdd);
                #endregion

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                // Clean up uploaded files if transaction fails
                if (lstAttachment.Any())
                {
                    await _uploadFileService.DeleteDataAsync(lstAttachment.Select(x => x.FileUrl).ToList());
                }

                throw;
            }
        }

        public async Task Update(EvidenceCycleMapRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            List<ModelAttachment> lstAttachment = new List<ModelAttachment>();

            try
            {
                await CheckCycleStageAsync(request.CycleId.ToString());
                await CheckPdcaPermissionAsync(request.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.EvidenceProvider));

                #region Evidence
                var update = await _context.Evidences.FindAsync(request.Evidence.Id);
                if (update == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                if (update.Status == ((int)EvidenceStatus.Pending) || update.Status == ((int)EvidenceStatus.Verified))
                {
                    throw new Exception("Không được cập nhật minh chứng đang chờ duyệt hoặc đã duyệt");
                }

                // Validate duplicate name or code
                var data = _context.Evidences.Where(x =>
                    (x.Name == request.Evidence.Name || x.Code == request.Evidence.Code)
                    && !x.IsDeleted && x.Id != request.Evidence.Id);

                if (await data.AnyAsync())
                {
                    throw new Exception("Tên hoặc mã minh chứng đã tồn tại");
                }

                _mapper.Map(request.Evidence, update);

                // Always reset to Draft after update to require re-approval
                update.Status = (int)EvidenceStatus.Draft;
                update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                update.UpdatedAt = DateTime.Now;

                _context.Evidences.Update(update);

                #region Thêm tài liệu đính kèm
                var ListDinhKemCanXoa = await _context.EvidenceAttachments.Where(x => x.RelatedId == update.Id
                                    && !x.IsDeleted
                                    && !request.Evidence.AttachmentIds.Any(y => y == x.Id)).ToListAsync();

                // Xóa các file không còn trong danh sách
                await _uploadFileService.DeleteDataAsync(ListDinhKemCanXoa.Select(x => x.FileUrl).ToList());
                foreach (var attachment in ListDinhKemCanXoa)
                {
                    attachment.UpdatedAt = DateTime.Now;
                    attachment.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                    attachment.IsDeleted = true;

                    _context.EvidenceAttachments.Update(attachment);
                }
                // Thêm mới các file trong danh sách
                lstAttachment = await _uploadFileService.UploadDataAsync(update.Id.ToString(), "Evidence", request.FolderUpload);
                foreach (var attachment in lstAttachment)
                {
                    Entities.EvidenceAttachment addAttachment = _mapper.Map<Entities.EvidenceAttachment>(attachment);
                    addAttachment.Id = Guid.NewGuid(); // Server-side ID generation only
                    addAttachment.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                    addAttachment.CreatedAt = DateTime.Now;
                    addAttachment.IsActived = true;
                    addAttachment.IsDeleted = false;

                    await _context.EvidenceAttachments.AddAsync(addAttachment);
                }
                #endregion
                #endregion

                #region Evidence cycle map
                var cycleMapUpdate = await _context.EvidenceCycleMaps.FindAsync(request.Id);
                if (cycleMapUpdate == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                cycleMapUpdate.CycleId = request.CycleId;
                cycleMapUpdate.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                cycleMapUpdate.UpdatedAt = DateTime.Now;
                _context.EvidenceCycleMaps.Update(cycleMapUpdate);
                #endregion

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                // Clean up uploaded files if transaction fails
                if (lstAttachment.Any())
                {
                    await _uploadFileService.DeleteDataAsync(lstAttachment.Select(x => x.FileUrl).ToList());
                }

                throw;
            }
        }

        public async Task DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.EvidenceCycleMaps.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                await CheckCycleStageAsync(delete.CycleId.ToString());
                await CheckPdcaPermissionAsync(delete.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.EvidenceProvider));

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.EvidenceCycleMaps.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>> GetList(EvidenceCycleMapGetListPagingRequest request)
        {
            var cycles = await _catalogService.GetCyclesStreamAsync(new CatalogService.Protos.GetCyclesStreamRequest()).ToListAsync();
            var activeCycleIds = cycles.Select(c => c.Id).ToList();

            var query = from ecm in _context.EvidenceCycleMaps.AsQueryable()
                        join e in _context.Evidences on ecm.EvidenceId equals e.Id
                        where !ecm.IsDeleted && activeCycleIds.Contains(ecm.CycleId)
                        select new ModelEvidenceCycleMapGetListPaging
                        {
                            Id = ecm.Id,
                            EvidenceId = ecm.EvidenceId,
                            CycleId = ecm.CycleId,
                            ReviewStatus = ecm.ReviewStatus,
                            FinalDecisionBy = ecm.FinalDecisionBy,
                            FinalDecisionAt = ecm.FinalDecisionAt,
                            Evidence_Name = e.Name,
                            Evidence_Code = e.Code,
                            Evidence_Status = e.Status,
                            Evidence_FileTypeId = e.FileTypeId,
                            CreatedAt = ecm.CreatedAt,
                            CreatedBy = ecm.CreatedBy,
                            UpdatedAt = ecm.UpdatedAt,
                            UpdatedBy = ecm.UpdatedBy,
                            IsActived = ecm.IsActived,
                        };

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    x.Evidence_Name!.Contains(request.TextSearch) ||
                    x.Evidence_Code!.Contains(request.TextSearch));
            }

            if (request.CycleId.HasValue)
            {
                query = query.Where(x => x.CycleId == request.CycleId.Value);
            }

            if (request.ReviewStatus.HasValue)
            {
                query = query.Where(x => x.ReviewStatus == request.ReviewStatus.Value);
            }

            if (request.EvidenceStatus.HasValue)
            {
                query = query.Where(x => x.Evidence_Status == request.EvidenceStatus.Value);
            }

            if (request.FileTypeId.HasValue)
            {
                query = query.Where(x => x.Evidence_FileTypeId == request.FileTypeId.Value);
            }

            // === Role-based visibility filter ===
            var username = _contextAccessor.HttpContext.User.Identity.Name;
            bool isAdmin = string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                var userIdString = _contextAccessor.HttpContext.User.Claims
                    .FirstOrDefault(x => x.Type == "name")?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var userId))
                {
                    var userCycleIds = await _catalogService
                        .GetCycleIdsByUserAsync(userIdString);
                    query = query.Where(x => userCycleIds.Contains(x.CycleId));
                }
                else
                {
                    return new GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>
                    {
                        PageIndex = request.PageIndex,
                        PageSize = request.PageSize,
                        TotalRow = 0,
                        Data = new List<ModelEvidenceCycleMapGetListPaging>()
                    };
                }
            }
            // === END: Role-based visibility filter ===

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            foreach (var item in data)
            {
                item.CycleName = cycles.FirstOrDefault(x => x.Id == item.CycleId)?.Name;
            }

            return new GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = data
            };
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox()
        {
            var data = await (from ecm in _context.EvidenceCycleMaps
                              join e in _context.Evidences on ecm.EvidenceId equals e.Id
                              where !ecm.IsDeleted && ecm.IsActived
                              select new ModelCombobox
                              {
                                  Text = e.Name,
                                  Value = ecm.Id.ToString()
                              }).OrderBy(x => x.Text).ToListAsync();

            return data;
        }

        public async Task SubmitToApprove(EvidenceSubmitToApproveRequest request)
        {

            if (request.Ids.Any())
            {
                foreach (var item in request.Ids)
                {
                    var evidenceCycleMap = await _context.EvidenceCycleMaps.FindAsync(item);
                    if (evidenceCycleMap is not null)
                    {
                        await CheckCycleStageAsync(evidenceCycleMap.CycleId.ToString());
                        await CheckPdcaPermissionAsync(evidenceCycleMap.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.EvidenceProvider));

                        var evidence = await _context.Evidences.FindAsync(evidenceCycleMap.EvidenceId);
                        if (evidence is not null)
                        {
                            if (evidence.Status == ((int)EvidenceStatus.Draft))
                            {
                                evidence.Status = ((int)EvidenceStatus.Pending);
                                evidence.UpdatedAt = DateTime.Now;
                                evidence.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                                _context.Evidences.Update(evidence);
                            }
                        }
                    }
                }
                await _context.SaveChangesAsync();
            }
        }

        public async Task Approve(EvidenceCycleMapApproveRequest request)
        {
            var evidenceCycleMap = await _context.EvidenceCycleMaps.FindAsync(request.Id);
            if (evidenceCycleMap is null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            await CheckCycleStageAsync(evidenceCycleMap.CycleId.ToString());
            await CheckPdcaPermissionAsync(evidenceCycleMap.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

            var evidence = await _context.Evidences.FindAsync(evidenceCycleMap.EvidenceId);
            if (evidence is null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            evidence.Status = request.EvidenceStatus;
            evidence.RejectionReason = request.RejectionReason;
            evidence.ApprovedAt = DateTime.Now;
            evidence.ApprovedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

            _context.Evidences.Update(evidence);
            await _context.SaveChangesAsync();
        }

        public async Task<List<VerifiedFileTypeCountResponse>> GetVerifiedFileTypeCountsAsync(Guid cycleId)
        {
            var verifiedData = await _context.EvidenceCycleMaps
                .Where(ecm => !ecm.IsDeleted && ecm.CycleId == cycleId)
                .Join(
                    _context.Evidences.Where(e => !e.IsDeleted && e.Status == (int)EvidenceStatus.Verified),
                    ecm => ecm.EvidenceId,
                    e   => e.Id,
                    (ecm, e) => new { e.FileTypeId, e.Name, e.Code }
                )
                .ToListAsync();

            var pendingData = await _context.EvidenceCycleMaps
                .Where(ecm => !ecm.IsDeleted && ecm.CycleId == cycleId)
                .Join(
                    _context.Evidences.Where(e => !e.IsDeleted && e.Status == (int)EvidenceStatus.Pending),
                    ecm => ecm.EvidenceId,
                    e   => e.Id,
                    (ecm, e) => new { e.FileTypeId }
                )
                .ToListAsync();

            var pendingMap = pendingData
                .GroupBy(x => x.FileTypeId)
                .ToDictionary(g => g.Key, g => g.Count());

            var result = verifiedData
                .GroupBy(x => x.FileTypeId)
                .Select(g => new VerifiedFileTypeCountResponse
                {
                    FileTypeId   = g.Key,
                    Count        = g.Count(),
                    PendingCount = pendingMap.GetValueOrDefault(g.Key, 0),
                    Evidences    = g.Select(x => new EvidenceSummary { Name = x.Name, Code = x.Code }).ToList()
                })
                .ToList();

            // Include file types that have only pending evidence (no verified yet)
            foreach (var kv in pendingMap)
            {
                if (!result.Any(r => r.FileTypeId == kv.Key))
                {
                    result.Add(new VerifiedFileTypeCountResponse
                    {
                        FileTypeId   = kv.Key,
                        Count        = 0,
                        PendingCount = kv.Value,
                        Evidences    = []
                    });
                }
            }

            return result;
        }
        public async Task<GetListPagingResponse<ModelVerifiedEvidenceForReuse>> GetVerifiedForReuseAsync(VerifiedEvidenceForReuseRequest request)
        {
            var query = _context.Evidences
                .Where(e => !e.IsDeleted && e.Status == (int)EvidenceStatus.Verified)
                .Where(e => !request.TargetCycleId.HasValue ||
                            !_context.EvidenceCycleMaps.Any(x =>
                                x.EvidenceId == e.Id &&
                                x.CycleId == request.TargetCycleId.Value &&
                                !x.IsDeleted &&
                                x.IsActived))
                .Select(e => new ModelVerifiedEvidenceForReuse
                {
                    Id               = e.Id,
                    EvidenceId       = e.Id,
                    Evidence_Name    = e.Name,
                    Evidence_Code    = e.Code,
                    FileTypeId       = e.FileTypeId,
                    CreatedAt        = e.CreatedAt,
                    Description      = e.Description,
                    IssueDate        = e.IssueDate,
                    ExpiryDate       = e.ExpiryDate,
                    IssuingAuthority = e.IssuingAuthority,
                });

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    x.Evidence_Name.Contains(request.TextSearch) ||
                    x.Evidence_Code.Contains(request.TextSearch));
            }

            if (request.FileTypeId.HasValue)
            {
                query = query.Where(x => x.FileTypeId == request.FileTypeId.Value);
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Populate attachments
            var evidenceIds = data.Select(x => x.EvidenceId).ToList();
            var attachments = await _context.EvidenceAttachments
                .Where(x => evidenceIds.Contains(x.RelatedId) && x.IsActived && !x.IsDeleted)
                .ToListAsync();

            foreach (var item in data)
            {
                item.ListAttachment = attachments
                    .Where(x => x.RelatedId == item.EvidenceId)
                    .Select(x => _mapper.Map<ModelAttachment>(x))
                    .ToList();
            }

            return new GetListPagingResponse<ModelVerifiedEvidenceForReuse>
            {
                PageIndex = request.PageIndex,
                PageSize  = request.PageSize,
                TotalRow  = totalRow,
                Data      = data
            };
        }

        public async Task ReuseVerifiedEvidenceAsync(ReuseVerifiedEvidenceRequest request)
        {
            await CheckCycleStageAsync(request.TargetCycleId.ToString());
            await CheckPdcaPermissionAsync(request.TargetCycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.EvidenceProvider));

            var evidence = await _context.Evidences.FindAsync(request.EvidenceId);
            if (evidence == null || evidence.Status != (int)EvidenceStatus.Verified)
                throw new Exception("Chỉ có thể tái sử dụng minh chứng đã được duyệt");

            var existing = await _context.EvidenceCycleMaps
                .FirstOrDefaultAsync(x => x.EvidenceId == request.EvidenceId
                                          && x.CycleId == request.TargetCycleId
                                          && !x.IsDeleted);
            if (existing != null)
                throw new Exception("Minh chứng này đã được liên kết với chu kỳ hiện tại");

            var cycleMap = new Entities.EvidenceCycleMap
            {
                Id           = Guid.NewGuid(),
                EvidenceId   = request.EvidenceId,
                CycleId      = request.TargetCycleId,
                ReviewStatus = (int)EvidenceCycleMapReviewStatus.NotStarted,
                CreatedBy    = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System",
                CreatedAt    = DateTime.Now,
                IsActived    = true,
                IsDeleted    = false
            };

            await _context.EvidenceCycleMaps.AddAsync(cycleMap);
            await _context.SaveChangesAsync();
        }
        #endregion

        #region Helper
        private static List<int> Roles(params CouncilRole[] roles)
            => roles.Select(r => (int)r).ToList();

        private async Task CheckPdcaPermissionAsync(string cycleId, List<int>? allowedRoles = null)
        {
            var userId = _contextAccessor.HttpContext!.User.Claims
                .FirstOrDefault(x => x.Type == "name")!.Value;
            var allowed = await _catalogService.CanUserDoActionInPdcaAsync(cycleId, userId, null, allowedRoles);
            if (!allowed)
                throw new Exception("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA");
        }

        /// <summary>
        /// Kiểm tra chu kỳ có đang ở giai đoạn Thực hiện (Do) không.
        /// Nếu không, chỉ Admin / Chủ tịch / PCT HĐ mới được tiếp tục.
        /// </summary>
        private async Task CheckCycleStageAsync(string cycleId)
        {
            var (found, status) = await _catalogService.GetCycleStatusAsync(cycleId);

            if (!found)
                throw new Exception("Chu kỳ không tồn tại");

            // CycleStatus.Do == 2 (Thực hiện) — matches CatalogService CommonEnum.CycleStatus.Do
            const int CycleStatusDo = 2;
            if (status == CycleStatusDo)
                return;

            var username = _contextAccessor.HttpContext!.User.Identity?.Name;
            if (string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase))
                return;

            var userId = _contextAccessor.HttpContext!.User.Claims
                .FirstOrDefault(x => x.Type == "name")?.Value;

            if (string.IsNullOrEmpty(userId))
                throw new Exception("Chu kỳ chưa ở giai đoạn Thực hiện, bạn không có quyền thực hiện thao tác này");

            var allowed = await _catalogService.CanUserDoActionInPdcaAsync(
                cycleId,
                userId,
                null,
                Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman));

            if (!allowed)
                throw new Exception("Chu kỳ chưa ở giai đoạn Thực hiện, bạn không có quyền thực hiện thao tác này");
        }

        private async Task<List<ModelAttachment>> GetAllAttachmentAsync(Guid Id)
        {
            var attachments = await _context.EvidenceAttachments
                .AsNoTracking()
                .Where(x => x.RelatedId == Id && x.IsActived && !x.IsDeleted)
                .ToListAsync();

            return attachments.Select(x => _mapper.Map<ModelAttachment>(x)).ToList();
        }
        #endregion
    }
}
