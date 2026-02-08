using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap
{
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
        public async Task<ModelEvidenceCycleMap> GetById(GetByIdRequest request)
        {
            var data = await _context.EvidenceCycleMaps.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelEvidenceCycleMap>(data);

            // Load Evidence details
            var evidence = await _context.Evidences.FindAsync(data.EvidenceId);
            if (evidence != null)
            {
                result.EvidenceName = evidence.Name;
                result.EvidenceCode = evidence.Code;
                result.Name = evidence.Name;
                result.Code = evidence.Code;
                result.Status = evidence.Status;
                result.IssueDate = evidence.IssueDate;
                result.IssuingAuthority = evidence.IssuingAuthority;
                result.ExpiryDate = evidence.ExpiryDate;
                result.FileTypeId = evidence.FileTypeId;
                result.RejectionReason = evidence.RejectionReason;
                result.Description = evidence.Description;
                result.ListAttachment = GetAllAttachment(evidence.Id);
            }

            return result;
        }

        public async Task Insert(EvidenceCycleMapRequest request)
        {
            var data = _context.Evidences.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Tên minh chứng đã tồn tại");
            }

            var add = _mapper.Map<Entities.Evidence>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.Status = request.Status == ((int)EvidenceStatus.Pending) ? ((int)EvidenceStatus.Pending) : ((int)EvidenceStatus.Draft);
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;
            await _context.Evidences.AddAsync(add);

            #region Thêm tài liệu đính kèm
            List<ModelAttachment> lstAttachment = await _uploadFileService.UploadDataAsync(add.Id.ToString(), "Evidence", request.FolderUpload);
            foreach (var attachment in lstAttachment)
            {
                Entities.EvidenceAttachment addAttachment = _mapper.Map<Entities.EvidenceAttachment>(attachment);
                addAttachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
                addAttachment.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                addAttachment.CreatedAt = DateTime.Now;
                addAttachment.IsActived = true;
                addAttachment.IsDeleted = false;

                await _context.EvidenceAttachments.AddAsync(addAttachment);
            }
            #endregion

            #region Thêm Evidence cycle map
            var criteriaStream = _catalogService.GetCriterionsForEvidenceStreamAsync(
                new CatalogService.Protos.GetCriterionsForEvidenceStreamRequest
                {
                    CycleId = request.CycleId.ToString(),
                    FileTypeId = request.FileTypeId.ToString()
                });

            await foreach (var criterion in criteriaStream)
            {
                var cycleMapAdd = new Entities.EvidenceCycleMap
                {
                    Id = Guid.NewGuid(),
                    EvidenceId = add.Id,
                    CycleId = request.CycleId,
                    ReviewStatus = ((int)EvidenceCycleMapReviewStatus.NotStarted),
                    CreatedBy = add.CreatedBy,
                    CreatedAt = DateTime.Now,
                    IsActived = true,
                    IsDeleted = false
                };
                await _context.EvidenceCycleMaps.AddAsync(cycleMapAdd);
            }
            #endregion

            await _context.SaveChangesAsync();
        }

        public async Task Update(EvidenceCycleMapRequest request)
        {
            var data = _context.Evidences.Where(x =>
                (x.Name == request.Name || x.Code == request.Code)
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên minh chứng đã tồn tại");
            }

            var update = await _context.Evidences.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            if (update.Status == ((int)EvidenceStatus.Pending) || update.Status == ((int)EvidenceStatus.Verified))
            {
                throw new Exception("Không được cập nhật minh chứng đang chờ duyệt hoặc đã duyệt");
            }

            _mapper.Map(request, update);

            update.Status = (int)EvidenceStatus.Draft;
            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;

            _context.Evidences.Update(update);

            #region Thêm tài liệu đính kèm
            var ListDinhKemCanXoa = _context.EvidenceAttachments.Where(x => x.RelatedId == update.Id
                                && !request.AttachmentIds.Any(y => y == x.Id)).ToList();

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
            List<ModelAttachment> lstAttachment = await _uploadFileService.UploadDataAsync(update.Id.ToString(), "Evidence", request.FolderUpload);
            foreach (var attachment in lstAttachment)
            {
                Entities.EvidenceAttachment addAttachment = _mapper.Map<Entities.EvidenceAttachment>(attachment);
                addAttachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
                addAttachment.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                addAttachment.CreatedAt = DateTime.Now;
                addAttachment.IsActived = true;
                addAttachment.IsDeleted = false;

                await _context.EvidenceAttachments.AddAsync(addAttachment);
            }
            #endregion

            await _context.SaveChangesAsync();
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

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.EvidenceCycleMaps.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelEvidenceCycleMap>> GetList(GetListPagingRequest request)
        {
            var query = from ecm in _context.EvidenceCycleMaps.AsQueryable()
                        join e in _context.Evidences on ecm.EvidenceId equals e.Id
                        where !ecm.IsDeleted
                        select new ModelEvidenceCycleMap
                        {
                            Id = ecm.Id,
                            EvidenceId = ecm.EvidenceId,
                            CycleId = ecm.CycleId,
                            ReviewStatus = ecm.ReviewStatus,
                            FinalDecisionBy = ecm.FinalDecisionBy,
                            FinalDecisionAt = ecm.FinalDecisionAt,
                            EvidenceName = e.Name,
                            EvidenceCode = e.Code,
                            CreatedAt = ecm.CreatedAt,
                            CreatedBy = ecm.CreatedBy,
                            UpdatedAt = ecm.UpdatedAt,
                            UpdatedBy = ecm.UpdatedBy,
                            IsActived = ecm.IsActived,
                        };

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.EvidenceName!.Contains(request.TextSearch));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return new GetListPagingResponse<ModelEvidenceCycleMap>
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
        #endregion

        #region Helper
        private List<ModelAttachment> GetAllAttachment(Guid Id)
        {
            var result = _context.EvidenceAttachments.Where(x => x.RelatedId == Id && x.IsActived && !x.IsDeleted)
                .Select(x => _mapper.Map<ModelAttachment>(x)).ToList();
            return result;
        }
        #endregion
    }
}
