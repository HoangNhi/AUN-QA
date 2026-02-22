using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

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
            var data = await _context.Evidences.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelEvidence>(data);
            result.ListAttachment = await GetAllAttachmentAsync(data.Id);

            return result;
        }

        public async Task<ModelFilePreview> PreviewAttachment(Guid attachmentId, string mode)
        {
            var attachment = await _context.EvidenceAttachments
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == attachmentId && x.IsActived && !x.IsDeleted);

            if (attachment == null)
            {
                throw new Exception("Tệp đính kèm không tồn tại");
            }

            return await _uploadFileService.PreviewFileAsync(attachment.FileUrl, mode);
        }

        public async Task Insert(EvidenceRequest request)
        {
            var isDuplicate = await _context.Evidences.AsNoTracking().AnyAsync(x =>
                (x.Name == request.Name || x.Code == request.Code)
                && !x.IsDeleted
            );

            if (isDuplicate)
            {
                throw new Exception("Tên hoặc mã minh chứng đã tồn tại");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var add = _mapper.Map<Entities.Evidence>(request);
                add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
                add.Status = request.Status == ((int)EvidenceStatus.Pending) ? ((int)EvidenceStatus.Pending) : ((int)EvidenceStatus.Draft);
                add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                add.CreatedAt = DateTime.Now;
                await _context.Evidences.AddAsync(add);

                // Thêm tài liệu đính kèm
                List<ModelAttachment> lstAttachment = await _uploadFileService.UploadDataAsync(add.Id.ToString(), "Evidence", request.FolderUpload);
                foreach (var attachment in lstAttachment)
                {
                    Entities.EvidenceAttachment addAttachment = _mapper.Map<Entities.EvidenceAttachment>(attachment);
                    addAttachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
                    addAttachment.CreatedBy = add.CreatedBy;
                    addAttachment.CreatedAt = DateTime.Now;
                    addAttachment.IsActived = true;
                    addAttachment.IsDeleted = false;

                    await _context.EvidenceAttachments.AddAsync(addAttachment);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task Update(EvidenceRequest request)
        {
            var isDuplicate = await _context.Evidences.AsNoTracking().AnyAsync(x =>
                (x.Name == request.Name || x.Code == request.Code)
                && !x.IsDeleted && x.Id != request.Id);

            if (isDuplicate)
            {
                throw new Exception("Tên hoặc mã minh chứng đã tồn tại");
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

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _mapper.Map(request, update);

                update.Status = (int)EvidenceStatus.Draft;
                update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                update.UpdatedAt = DateTime.Now;

                _context.Evidences.Update(update);

                // Cập nhật tài liệu đính kèm
                var listDinhKemCanXoa = await _context.EvidenceAttachments.Where(x => x.RelatedId == update.Id
                                    && !x.IsDeleted
                                    && !request.AttachmentIds.Any(y => y == x.Id)).ToListAsync();

                // Xóa các file không còn trong danh sách
                if (listDinhKemCanXoa.Any())
                {
                    await _uploadFileService.DeleteDataAsync(listDinhKemCanXoa.Select(x => x.FileUrl).ToList());
                    foreach (var attachment in listDinhKemCanXoa)
                    {
                        attachment.UpdatedAt = DateTime.Now;
                        attachment.UpdatedBy = update.UpdatedBy;
                        attachment.IsDeleted = true;

                        _context.EvidenceAttachments.Update(attachment);
                    }
                }
                
                // Thêm mới các file trong danh sách
                List<ModelAttachment> lstAttachment = await _uploadFileService.UploadDataAsync(update.Id.ToString(), "Evidence", request.FolderUpload);
                foreach (var attachment in lstAttachment)
                {
                    Entities.EvidenceAttachment addAttachment = _mapper.Map<Entities.EvidenceAttachment>(attachment);
                    addAttachment.Id = attachment.Id == Guid.Empty ? Guid.NewGuid() : attachment.Id;
                    addAttachment.CreatedBy = update.UpdatedBy;
                    addAttachment.CreatedAt = DateTime.Now;
                    addAttachment.IsActived = true;
                    addAttachment.IsDeleted = false;

                    await _context.EvidenceAttachments.AddAsync(addAttachment);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
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

                if (delete.Status == ((int)EvidenceStatus.Pending) || delete.Status == ((int)EvidenceStatus.Verified))
                {
                    throw new Exception("Không được xóa minh chứng đang chờ duyệt hoặc đã duyệt");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";

                _context.Evidences.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelEvidenceGetListPaging>> GetList(EvidenceGetListPagingRequest request)
        {
            var fileTypes = await _catalogService.GetFileTypesStreamAsync(new CatalogService.Protos.GetFileTypesStreamRequest()).ToListAsync();
            var fileTypeDict = fileTypes.ToDictionary(f => f.Id, f => f.Name);

            var query = _context.Evidences.AsQueryable().Where(x => !x.IsDeleted);

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    (x.Name ?? string.Empty).Contains(request.TextSearch)
                    || (x.Code ?? string.Empty).Contains(request.TextSearch));
            }

            if (request.Status.HasValue)
            {
                query = query.Where(x => x.Status == request.Status.Value);
            }

            if (request.FileTypeId.HasValue)
            {
                query = query.Where(x => x.FileTypeId == request.FileTypeId.Value);
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
            return await _context.Evidences
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.IsActived == true)
                .Select(x => new ModelCombobox
                {
                    Text = x.Name,
                    Value = x.Id.ToString()
                })
                .OrderBy(x => x.Text)
                .ToListAsync();
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
