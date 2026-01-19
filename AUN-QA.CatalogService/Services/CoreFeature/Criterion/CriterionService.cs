using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Requests;
using AUN_QA.CatalogService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.CatalogService.Services.CoreFeature.Criterion
{
    [RegisterClassAsTransient]
    public class CriterionService : ICriterionService
    {
        private readonly CatalogContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public CriterionService(
            CatalogContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public async Task<ModelCriterion> GetById(GetByIdRequest request)
        {
            var data = await _context.Criteria
                .Include(x => x.Standard)
                .FirstOrDefaultAsync(x => x.Id == request.Id);
            
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelCriterion>(data);
            result.StandardName = data.Standard?.Name ?? "";
            return result;
        }

        public async Task<ModelCriterion> Insert(CriterionRequest request)
        {
            var data = _context.Criteria.Where(x =>
                (x.Code == request.Code || x.Name == request.Name)
                && x.StandardId == request.StandardId
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Mã hoặc tên tiêu chí đã tồn tại trong tiêu chuẩn này");
            }

            var add = _mapper.Map<Entities.Criterion>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;
            add.IsActived = true;
            add.IsDeleted = false;

            await _context.Criteria.AddAsync(add);
            await _context.SaveChangesAsync();

            return await GetById(new GetByIdRequest { Id = add.Id });
        }

        public async Task<ModelCriterion> Update(CriterionRequest request)
        {
            var data = _context.Criteria.Where(x =>
                (x.Code == request.Code || x.Name == request.Name)
                && x.StandardId == request.StandardId
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Mã hoặc tên tiêu chí đã tồn tại trong tiêu chuẩn này");
            }

            var update = await _context.Criteria.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;

            _context.Criteria.Update(update);
            await _context.SaveChangesAsync();

            return await GetById(new GetByIdRequest { Id = update.Id });
        }

        public async Task<string> DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.Criteria.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Criteria.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelCriterion>> GetList(GetListPagingRequest request)
        {
            var query = _context.Criteria
                .Include(x => x.Standard)
                .AsQueryable()
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Name.Contains(request.TextSearch) 
                    || x.Code.Contains(request.TextSearch)
                    || x.Standard.Name.Contains(request.TextSearch));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt.HasValue ? x.UpdatedAt : x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var result = data.Select(x =>
            {
                var model = _mapper.Map<ModelCriterion>(x);
                model.StandardName = x.Standard?.Name ?? "";
                return model;
            }).ToList();

            return new GetListPagingResponse<ModelCriterion>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = result
            };
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox()
        {
            var data = await _context.Criteria
                .Include(x => x.Standard)
                .Where(x => !x.IsDeleted && x.IsActived == true)
                .ToListAsync();
            
            return data.Select(x => new ModelCombobox
            {
                Text = $"{x.Code} - {x.Name} ({x.Standard?.Code})",
                Value = x.Id.ToString()
            }).OrderBy(x => x.Text).ToList();
        }
    }
}
