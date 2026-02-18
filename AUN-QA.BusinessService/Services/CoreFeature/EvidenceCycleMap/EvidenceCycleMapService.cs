using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System.Net.WebSockets;

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
            var data = await _context.EvidenceCycleMaps.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.Evaluator, CouncilRole.EvidenceProvider));

            var result = _mapper.Map<EvidenceCycleMapRequest>(data);

            // Load Evidence details
            var evidence = await _context.Evidences.FindAsync(data.EvidenceId);
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
                await CheckPdcaPermissionAsync(request.CycleId.ToString(), Roles(CouncilRole.Secretary, CouncilRole.EvidenceProvider));

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
                await CheckPdcaPermissionAsync(request.CycleId.ToString(), Roles(CouncilRole.Secretary, CouncilRole.EvidenceProvider));

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
                var ListDinhKemCanXoa = _context.EvidenceAttachments.Where(x => x.RelatedId == update.Id
                                    && !request.Evidence.AttachmentIds.Any(y => y == x.Id)).ToList();

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

                await CheckPdcaPermissionAsync(delete.CycleId.ToString(), Roles(CouncilRole.Secretary));

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.EvidenceCycleMaps.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>> GetList(EvidenceCycleMapGetListPagingRequest request)
        {
            if (request.CycleId.HasValue)
                await CheckPdcaPermissionAsync(request.CycleId.Value.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.Evaluator, CouncilRole.EvidenceProvider));

            var cycle = await _catalogService.GetCyclesStreamAsync(new CatalogService.Protos.GetCyclesStreamRequest()).ToListAsync();

            var query = from ecm in _context.EvidenceCycleMaps.AsQueryable()
                        join e in _context.Evidences on ecm.EvidenceId equals e.Id
                        where !ecm.IsDeleted
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

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            // Populate CycleName from in-memory cycle list
            foreach (var item in data)
            {
                item.CycleName = cycle.FirstOrDefault(x => x.Id == item.CycleId)?.Name;
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
                    var evidenceCycleMap = _context.EvidenceCycleMaps.Find(item);
                    if (evidenceCycleMap is not null)
                    {
                        await CheckPdcaPermissionAsync(evidenceCycleMap.CycleId.ToString(), Roles(CouncilRole.Secretary, CouncilRole.EvidenceProvider));

                        var evidence = _context.Evidences.Find(evidenceCycleMap.EvidenceId);
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
            var evidenceCycleMap = _context.EvidenceCycleMaps.Find(request.Id);
            if (evidenceCycleMap is null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            await CheckPdcaPermissionAsync(evidenceCycleMap.CycleId.ToString(), Roles(CouncilRole.Secretary));

            var evidence = _context.Evidences.Find(evidenceCycleMap.EvidenceId);
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

        private async Task<List<ModelAttachment>> GetAllAttachmentAsync(Guid Id)
        {
            var result = await _context.EvidenceAttachments
                .Where(x => x.RelatedId == Id && x.IsActived && !x.IsDeleted)
                .Select(x => _mapper.Map<ModelAttachment>(x))
                .ToListAsync();
            return result;
        }
        #endregion
    }
}
