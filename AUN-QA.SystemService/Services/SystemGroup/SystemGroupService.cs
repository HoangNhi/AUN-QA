using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Requests;
using AUN_QA.SystemService.Helpers;
using AUN_QA.SystemService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Npgsql;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.SystemService.Services.SystemGroup
{
    [RegisterClassAsTransient]
    public class SystemGroupService : ISystemGroupService
    {
        private readonly SystemContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public SystemGroupService(
            SystemContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public async Task<ModelSystemGroup> GetById(GetByIdRequest request)
        {
            var data = await _context.SystemGroups.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Not found");
            }

            return _mapper.Map<ModelSystemGroup>(data);
        }

        public async Task<ModelSystemGroup> Insert(SystemGroupRequest request)
        {
            var data = _context.SystemGroups.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Tên nhóm đã tồn tại");
            }

            var add = _mapper.Map<Entities.SystemGroup>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;

            await _context.SystemGroups.AddAsync(add);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelSystemGroup>(add);
        }

        public async Task<ModelSystemGroup> Update(SystemGroupRequest request)
        {
            var data = _context.SystemGroups.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên nhóm đã tồn tại");
            }

            var update = await _context.SystemGroups.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;
            _context.SystemGroups.Update(update);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelSystemGroup>(update);
        }

        public async Task<string> DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.SystemGroups.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.SystemGroups.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelSystemGroupGetListPaging>> GetList(GetListPagingRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_textsearch", request.TextSearch),
                new NpgsqlParameter("i_pageindex", request.PageIndex == -1 ? -1 : request.PageIndex - 1),
                new NpgsqlParameter("i_pagesize", request.PageSize),
            };

            var result = await _context.ExecuteFunction<GetListPagingResponse<ModelSystemGroupGetListPaging>>("fn_system_group_getlistpaging", parameters);
            return result;
        }

        public async Task<List<ModelSystemGroup>> GetAll()
        {
            var data = await _context.SystemGroups.Where(x => !x.IsDeleted && x.IsActived).ToListAsync();
            var result = _mapper.Map<List<ModelSystemGroup>>(data).OrderBy(x => x.Sort).ToList();
            return result;
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox()
        {
            var data = await _context.SystemGroups.Where(x => !x.IsDeleted && x.IsActived).ToListAsync();
            var result = data.Select(x => new ModelCombobox
            {
                Text = x.Name,
                Value = x.Id.ToString(),
                Parent = x.ParentId.HasValue ? data.FirstOrDefault(y => y.Id == x.ParentId)?.Name : ""
            }).OrderBy(x => x.Sort).ToList();

            return result;
        }
    }
}
