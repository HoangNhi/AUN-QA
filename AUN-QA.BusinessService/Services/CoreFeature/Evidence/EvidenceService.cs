using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.Evidence
{
    [RegisterClassAsTransient]
    public class EvidenceService : IEvidenceService
    {
        private readonly BusinessContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly IUploadFileService _uploadFileService;
        private readonly ICatalogIntegrationService _catalogService;

        public EvidenceService(
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

        #region CRUD
        public async Task<ModelEvidence> GetById(GetByIdRequest request)
        {
            var data = await _context.Evidences.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelEvidence>(data);
            result.ListAttachment = GetAllAttachment(data.Id);

            return result;
        }

        public async Task Insert(EvidenceRequest request)
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

            await _context.SaveChangesAsync();
        }

        public async Task Update(EvidenceRequest request)
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
                var delete = await _context.Evidences.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.Evidences.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelEvidenceGetListPaging>> GetList(GetListPagingRequest request)
        {
            var fileTypes = await _catalogService.GetFileTypesStreamAsync(new CatalogService.Protos.GetFileTypesStreamRequest()).ToListAsync();
            var fileTypeDict = fileTypes.ToDictionary(f => f.Id, f => f.Name);

            var query = _context.Evidences.AsQueryable().Where(x => !x.IsDeleted);

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Name.Contains(request.TextSearch));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var result = data.Select(x =>
            {
                var res = _mapper.Map<ModelEvidenceGetListPaging>(x);
                res.StatusName = x.Status switch
                {
                    (int)EvidenceStatus.Draft => "Chưa gửi",
                    (int)EvidenceStatus.Pending => "Đã gửi",
                    (int)EvidenceStatus.Verified => "Đã duyệt",
                    (int)EvidenceStatus.Rejected => "Không duyệt",
                    (int)EvidenceStatus.Expired => "Hết hạn",
                    _ => "Không xác định"
                };
                res.FileTypeName = fileTypeDict.TryGetValue(x.FileTypeId.ToString(), out var name) ? name : null;
                return res;
            }).ToList();

            return new GetListPagingResponse<ModelEvidenceGetListPaging>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = result
            };
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox()
        {
            var data = await _context.Evidences.Where(x => !x.IsDeleted && x.IsActived == true).ToListAsync();
            return data.Select(x => new ModelCombobox
            {
                Text = x.Name,
                Value = x.Id.ToString()
            }).OrderBy(x => x.Text).ToList();
        }

        public async Task SubmitForReview(EvidenceSubmitToApproveRequest request)
        {
            if (!request.Ids.Any())
                throw new Exception("Không có minh chứng để gửi duyệt");

            foreach (var id in request.Ids)
            {
                var evidence = await _context.Evidences.FindAsync(id);
                if (evidence == null)
                    throw new Exception("Minh chứng không tồn tại");

                if (evidence.Status != (int)EvidenceStatus.Draft)
                    continue;

                evidence.Status = (int)EvidenceStatus.Pending;
                evidence.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                evidence.UpdatedAt = DateTime.Now;
                _context.Evidences.Update(evidence);
            }

            await _context.SaveChangesAsync();
        }

        public async Task Approve(EvidenceApproveRequest request)
        {
            var evidence = await _context.Evidences.FindAsync(request.Id);
            if (evidence == null)
                throw new Exception("Minh chứng không tồn tại");

            if (evidence.Status != (int)EvidenceStatus.Pending)
                throw new Exception("Chỉ được duyệt minh chứng đang chờ duyệt");

            evidence.Status = request.EvidenceStatus;
            evidence.RejectionReason = request.RejectionReason;
            evidence.ApprovedAt = DateTime.Now;
            evidence.ApprovedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            evidence.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            evidence.UpdatedAt = DateTime.Now;

            _context.Evidences.Update(evidence);
            await _context.SaveChangesAsync();
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
