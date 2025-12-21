using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.Menu.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Menu.Requests;
using AUN_QA.SystemService.Helpers;
using AUN_QA.SystemService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Npgsql;

namespace AUN_QA.SystemService.Services.Menu
{
    [RegisterClassAsTransient]
    public class MenuService : IMenuService
    {
        private readonly SystemContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public MenuService(
            SystemContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public ModelMenu GetById(GetByIdRequest request)
        {
            var data = _context.Menus.Find(request.Id);
            if (data == null)
            {
                throw new Exception("Not found");
            }

            return _mapper.Map<ModelMenu>(data);
        }

        public ModelMenu Insert(MenuRequest request)
        {
            var data = _context.Menus.Where(x =>
                x.Name == request.Name && x.SystemGroupId == request.SystemGroupId
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Tên menu đã tồn tại trong nhóm này");
            }

            var add = _mapper.Map<Entities.Menu>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.Controller = add.Controller.ToLower();
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;

            _context.Menus.Add(add);
            _context.SaveChanges();

            return _mapper.Map<ModelMenu>(add);
        }

        public ModelMenu Update(MenuRequest request)
        {
            var data = _context.Menus.Where(x =>
                x.Name == request.Name && x.SystemGroupId == request.SystemGroupId
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên menu đã tồn tại trong nhóm này");
            }

            var update = _context.Menus.Find(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.Controller = update.Controller.ToLower();
            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;
            _context.Menus.Update(update);
            _context.SaveChanges();

            return _mapper.Map<ModelMenu>(update);
        }

        public string DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = _context.Menus.Find(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Menus.Update(delete);
            }

            _context.SaveChanges();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelMenuGetListPaging>> GetList(GetListPagingRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_textsearch", request.TextSearch),
                new NpgsqlParameter("i_pageindex", request.PageIndex - 1),
                new NpgsqlParameter("i_pagesize", request.PageSize),
            };

            var result = await _context.ExcuteFunction<GetListPagingResponse<ModelMenuGetListPaging>>("fn_menu_getlistpaging", parameters);
            return result;
        }

        public async Task<List<ModelMenuGetListPaging>> GetListByUser(GetByIdRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_user_id", request.Id),
            };

            var result = await _context.ExcuteFunction<List<ModelMenuGetListPaging>>("fn_menu_getbyuser", parameters);
            return result;
        }
    }
}
