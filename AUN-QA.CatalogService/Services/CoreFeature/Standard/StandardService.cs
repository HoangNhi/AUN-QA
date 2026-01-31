using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;
using AUN_QA.CatalogService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.CatalogService.Services.CoreFeature.Standard
{
    [RegisterClassAsTransient]
    public class StandardService : IStandardService
    {
        private readonly CatalogContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public StandardService(
            CatalogContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public async Task<ModelStandard> GetById(GetByIdRequest request)
        {
            var data = await _context.Standards.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            return _mapper.Map<ModelStandard>(data);
        }

        public async Task<ModelStandard> Insert(StandardRequest request)
        {
            var data = _context.Standards.Where(x =>
                (x.Code == request.Code || x.Name == request.Name)
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Mã hoặc tên tiêu chuẩn đã tồn tại");
            }

            var add = _mapper.Map<Entities.Standard>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;
            add.IsActived = true;
            add.IsDeleted = false;

            await _context.Standards.AddAsync(add);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelStandard>(add);
        }

        public async Task<ModelStandard> Update(StandardRequest request)
        {
            var data = _context.Standards.Where(x =>
                (x.Code == request.Code || x.Name == request.Name)
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Mã hoặc tên tiêu chuẩn đã tồn tại");
            }

            var update = await _context.Standards.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;

            _context.Standards.Update(update);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelStandard>(update);
        }

        public async Task<string> DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.Standards.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Standards.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelStandard>> GetList(GetListPagingRequest request)
        {
            var query = _context.Standards.AsQueryable().Where(x => !x.IsDeleted);

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Name.Contains(request.TextSearch)
                    || x.Code.Contains(request.TextSearch));
                //|| x.AunVersion.Contains(request.TextSearch));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return new GetListPagingResponse<ModelStandard>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = _mapper.Map<List<ModelStandard>>(data)
            };
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox()
        {
            var data = await _context.Standards.Where(x => !x.IsDeleted && x.IsActived == true).ToListAsync();
            return data.Select(x => new ModelCombobox
            {
                Text = $"{x.Code} - {x.Name}",
                Value = x.Id.ToString()
            }).OrderBy(x => x.Text).ToList();
        }
    }
}
