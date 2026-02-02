using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.CriterionRequirement.Requests;
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

            foreach (var criterion in result.Criterions)
            {
                var options = await _context.CriterionRequirements
                    .Where(x => x.CriterionId == criterion.Id && !x.IsDeleted)
                    .ToListAsync();

                criterion.CriterionRequirements = _mapper.Map<List<CriterionRequirementRequest>>(options);
            }

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

                // Criterion Requirements
                foreach (var option in criterion.CriterionRequirements)
                {
                    var addOption = _mapper.Map<Entities.CriterionRequirement>(option);
                    addOption.Id = option.Id == Guid.Empty ? Guid.NewGuid() : option.Id;
                    addOption.CriterionId = addCriterion.Id;
                    addOption.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addOption.CreatedAt = DateTime.Now;
                    await _context.CriterionRequirements.AddAsync(addOption);
                }
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

                    #region CriterionRequirements for existing Criterion
                    // Get existing CriterionRequirements for this Criterion
                    var existingRequirements = _context.CriterionRequirements
                        .Where(r => r.CriterionId == existingCriterion.Id && !r.IsDeleted)
                        .ToList();

                    // Mark removed CriterionRequirements as deleted
                    var requestRequirementIds = criterion.CriterionRequirements.Select(r => r.Id).ToList();
                    var removedRequirements = existingRequirements
                        .Where(r => !requestRequirementIds.Contains(r.Id));

                    foreach (var removed in removedRequirements)
                    {
                        removed.IsDeleted = true;
                        removed.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        removed.UpdatedAt = DateTime.Now;
                        _context.CriterionRequirements.Update(removed);
                    }

                    // Process each CriterionRequirement in the request
                    foreach (var requirementRequest in criterion.CriterionRequirements)
                    {
                        var existingRequirement = existingRequirements
                            .FirstOrDefault(r => r.Id == requirementRequest.Id);

                        if (existingRequirement != null)
                        {
                            // Update existing CriterionRequirement
                            _mapper.Map(requirementRequest, existingRequirement);
                            existingRequirement.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                            existingRequirement.UpdatedAt = DateTime.Now;
                            _context.CriterionRequirements.Update(existingRequirement);
                        }
                        else
                        {
                            // Add new CriterionRequirement
                            var addRequirement = _mapper.Map<Entities.CriterionRequirement>(requirementRequest);
                            addRequirement.Id = requirementRequest.Id == Guid.Empty ? Guid.NewGuid() : requirementRequest.Id;
                            addRequirement.CriterionId = existingCriterion.Id;
                            addRequirement.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                            addRequirement.CreatedAt = DateTime.Now;
                            await _context.CriterionRequirements.AddAsync(addRequirement);
                        }
                    }
                    #endregion
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

                    #region CriterionRequirements for new Criterion
                    // Add all CriterionRequirements for the new Criterion
                    foreach (var requirementRequest in criterion.CriterionRequirements)
                    {
                        var addRequirement = _mapper.Map<Entities.CriterionRequirement>(requirementRequest);
                        addRequirement.Id = requirementRequest.Id == Guid.Empty ? Guid.NewGuid() : requirementRequest.Id;
                        addRequirement.CriterionId = addCriterion.Id;
                        addRequirement.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        addRequirement.CreatedAt = DateTime.Now;
                        await _context.CriterionRequirements.AddAsync(addRequirement);
                    }
                    #endregion
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

        public async Task<GetListPagingResponse<ModelStandardGetListPaging>> GetList(GetListPagingRequest request)
        {
            var query = from s in _context.Standards.Where(x => !x.IsDeleted)
                        join ss in _context.StandardSets.Where(x => !x.IsDeleted && x.IsActived)
                        on s.StandardSetId equals ss.Id
                        select new { Standard = s, StandardSetName = ss.Name };

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Standard.Name.Contains(request.TextSearch)
                    || x.Standard.Code.Contains(request.TextSearch)
                    || (x.Standard.Description != null && x.Standard.Description.Contains(request.TextSearch)));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.Standard.UpdatedAt.HasValue ? x.Standard.UpdatedAt : x.Standard.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var result = data.Select(x => new ModelStandardGetListPaging
            {
                Id = x.Standard.Id,
                StandardSetId = x.Standard.StandardSetId,
                Code = x.Standard.Code,
                Name = x.Standard.Name,
                Description = x.Standard.Description,
                Order = x.Standard.Order,
                IsActived = x.Standard.IsActived,
                CreatedAt = x.Standard.CreatedAt,
                CreatedBy = x.Standard.CreatedBy,
                UpdatedAt = x.Standard.UpdatedAt,
                UpdatedBy = x.Standard.UpdatedBy,
                StandardSet = x.StandardSetName
            }).ToList();

            return new GetListPagingResponse<ModelStandardGetListPaging>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = result
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
