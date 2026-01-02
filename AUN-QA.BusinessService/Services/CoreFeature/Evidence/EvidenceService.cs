using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
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

        public EvidenceService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            IUploadFileService uploadFileService)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _uploadFileService = uploadFileService;
        }

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

        public async Task<ModelEvidence> Insert(EvidenceRequest request)
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
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;
            await _context.Evidences.AddAsync(add);

            #region Thêm tài liệu đính kèm
            List<ModelAttachment> lstAttachment = new List<ModelAttachment>();
            lstAttachment = await _uploadFileService.UploadDataAsync(add.Id.ToString(), "Evidence", request.FolderUpload);
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
            return _mapper.Map<ModelEvidence>(add);
        }

        public async Task<ModelEvidence> Update(EvidenceRequest request)
        {
            var data = _context.Evidences.Where(x =>
                x.Name == request.Name
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

            _mapper.Map(request, update);

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
            List<ModelAttachment> lstAttachment = new List<ModelAttachment>();
            lstAttachment = await _uploadFileService.UploadDataAsync(update.Id.ToString(), "Evidence", request.FolderUpload);
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

            return _mapper.Map<ModelEvidence>(update);
        }

        public async Task<string> DeleteList(DeleteListRequest request)
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
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelEvidence>> GetList(GetListPagingRequest request)
        {
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

            return new GetListPagingResponse<ModelEvidence>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = _mapper.Map<List<ModelEvidence>>(data)
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

        private List<ModelAttachment> GetAllAttachment(Guid Id)
        {
            var result = _context.EvidenceAttachments.Where(x => x.RelatedId == Id && x.IsActived && !x.IsDeleted)
                .Select(x => _mapper.Map<ModelAttachment>(x)).ToList();
            return result;
        }

    }
}
