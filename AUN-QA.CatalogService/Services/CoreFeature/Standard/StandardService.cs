using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests;
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

        public async Task<StandardRequest> GetById(GetByIdRequest request)
        {
            var data = await _context.Standards.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<StandardRequest>(data);
            var criteria = await _context.Criteria
                .Where(x => x.StandardId == data.Id && !x.IsDeleted)
                .OrderBy(x => x.Order)
                .ToListAsync();

            result.Criterions = _mapper.Map<List<CriterionRequest>>(criteria);

            return result;
        }

        public async Task Insert(StandardRequest request)
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
            add.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            add.CreatedAt = DateTime.Now;

            #region Criterions
            if (!request.Criterions.Any())
            {
                throw new Exception("Tiêu chí không được để trống");
            }

            foreach (var criterion in request.Criterions)
            {
                var addCriterion = _mapper.Map<Entities.Criterion>(criterion);
                addCriterion.Id = criterion.Id == Guid.Empty ? Guid.NewGuid() : criterion.Id;
                addCriterion.StandardId = add.Id;
                addCriterion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                addCriterion.CreatedAt = DateTime.Now;
                await _context.Criteria.AddAsync(addCriterion);
            }
            #endregion

            await _context.Standards.AddAsync(add);
            await _context.SaveChangesAsync();
        }

        public async Task Update(StandardRequest request)
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

            update.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            update.UpdatedAt = DateTime.Now;

            #region Criterions
            var existingCriterions = _context.Criteria
                .Where(x => x.StandardId == update.Id && !x.IsDeleted)
                .ToList();
            // Mark removed criterions as deleted
            foreach (var existing in existingCriterions)
            {
                if (!request.Criterions.Any(x => x.Id == existing.Id))
                {
                    existing.IsDeleted = true;
                    existing.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    existing.UpdatedAt = DateTime.Now;
                    _context.Criteria.Update(existing);
                }
            }
            // Add or update criterions
            foreach (var criterion in request.Criterions)
            {
                var existingCriterion = existingCriterions
                    .FirstOrDefault(x => x.Id == criterion.Id);
                if (existingCriterion != null)
                {
                    // Update existing
                    _mapper.Map(criterion, existingCriterion);
                    existingCriterion.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    existingCriterion.UpdatedAt = DateTime.Now;
                    _context.Criteria.Update(existingCriterion);
                }
                else
                {
                    // Add new
                    var addCriterion = _mapper.Map<Entities.Criterion>(criterion);
                    addCriterion.Id = criterion.Id == Guid.Empty ? Guid.NewGuid() : criterion.Id;
                    addCriterion.StandardId = update.Id;
                    addCriterion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addCriterion.CreatedAt = DateTime.Now;
                    await _context.Criteria.AddAsync(addCriterion);
                }
            }
            #endregion

            _context.Standards.Update(update);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.Standards.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                delete.UpdatedAt = DateTime.Now;

                _context.Standards.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelStandard>> GetList(GetListPagingRequest request)
        {
            var query = _context.Standards.AsQueryable().Where(x => !x.IsDeleted);

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Name.Contains(request.TextSearch)
                    || x.Code.Contains(request.TextSearch)
                    || x.Name.Contains(request.TextSearch)
                    || (x.Description != null && x.Description.Contains(request.TextSearch)));
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
