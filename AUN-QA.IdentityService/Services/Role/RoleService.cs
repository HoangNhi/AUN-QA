using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.Permision.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Role.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Role.Requests;
using AUN_QA.IdentityService.Helpers;
using AUN_QA.IdentityService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Npgsql;

namespace AUN_QA.IdentityService.Services.Role
{
    [RegisterClassAsTransient]
    public class RoleService : IRoleService
    {
        private readonly IdentityContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public RoleService(
            IdentityContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public ModelRole GetById(GetByIdRequest request)
        {
            var data = _context.Roles.Find(request.Id);
            if (data == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            return _mapper.Map<ModelRole>(data);
        }

        public ModelRole Insert(RoleRequest request)
        {
            var data = _context.Roles.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Tên gọi đã tồn tại");
            }

            var add = _mapper.Map<Entities.Role>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;
            add.IsActived = true;

            _context.Roles.Add(add);
            _context.SaveChanges();

            return _mapper.Map<ModelRole>(add);
        }

        public ModelRole Update(RoleRequest request)
        {
            var data = _context.Roles.Where(x =>
                x.Name == request.Name
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên gọi đã tồn tại");
            }

            var update = _context.Roles.Find(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;
            _context.Roles.Update(update);
            _context.SaveChanges();

            return _mapper.Map<ModelRole>(update);
        }

        public string DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = _context.Roles.Find(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Roles.Update(delete);
            }

            _context.SaveChanges();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelRoleGetListPaging>> GetList(GetListPagingRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_textsearch", request.TextSearch),
                new NpgsqlParameter("i_pageindex", request.PageIndex - 1),
                new NpgsqlParameter("i_pagesize", request.PageSize),
            };

            var result = await _context.ExcuteFunction<GetListPagingResponse<ModelRoleGetListPaging>>("fn_role_getlistpaging", parameters);
            return result;
        }

        public async Task<List<ModelPermision>> GetPermissionsByRole(GetByIdRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_role_id", request.Id)
            };

            var result = await _context.ExcuteFunction<List<ModelPermision>>("fn_permision_getbyrole", parameters);
            return result;
        }
    }
}
