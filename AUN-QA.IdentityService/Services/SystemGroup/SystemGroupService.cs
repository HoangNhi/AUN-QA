using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Requests;
using AUN_QA.IdentityService.Helpers;
using AUN_QA.IdentityService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Npgsql;

namespace AUN_QA.IdentityService.Services.SystemGroup
{
    [RegisterClassAsTransient]
    public class SystemGroupService : ISystemGroupService
    {
        private readonly IdentityContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public SystemGroupService(
            IdentityContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public ModelSystemGroup GetById(GetByIdRequest request)
        {
            var data = _context.SystemGroups.Find(request.Id);
            if (data == null)
            {
                throw new Exception("Not found");
            }

            return _mapper.Map<ModelSystemGroup>(data);
        }

        public ModelSystemGroup Insert(SystemGroupRequest request)
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

            _context.SystemGroups.Add(add);
            _context.SaveChanges();

            return _mapper.Map<ModelSystemGroup>(add);
        }

        public ModelSystemGroup Update(SystemGroupRequest request)
        {
            var data = _context.SystemGroups.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên nhóm đã tồn tại");
            }

            var update = _context.SystemGroups.Find(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;
            _context.SystemGroups.Update(update);
            _context.SaveChanges();

            return _mapper.Map<ModelSystemGroup>(update);
        }

        public string DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = _context.SystemGroups.Find(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.SystemGroups.Update(delete);
            }

            _context.SaveChanges();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelSystemGroupGetListPaging>> GetList(GetListPagingRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_textsearch", request.TextSearch),
                new NpgsqlParameter("i_pageindex", request.PageIndex - 1),
                new NpgsqlParameter("i_pagesize", request.PageSize),
            };

            var result = await _context.ExcuteFunction<GetListPagingResponse<ModelSystemGroupGetListPaging>>("fn_system_group_getlistpaging", parameters);
            return result;
        }

        public List<MODELCombobox> GetAllForCombobox()
        {
            var data = _context.SystemGroups.Where(x => !x.IsDeleted && x.IsActived).ToList();
            var result = data.Select(x => new MODELCombobox
            {
                Text = x.Name,
                Value = x.Id.ToString(),
                Parent = x.ParentId.HasValue ? data.FirstOrDefault(y => y.Id == x.ParentId)?.Name : ""
            }).OrderBy(x => x.Text).ToList();

            return result;
        }
    }
}
