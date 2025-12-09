using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.Menu.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Menu.Requests;
using AUN_QA.IdentityService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.IdentityService.Services.Menu
{
    [RegisterClassAsTransient]
    public class MenuService : IMenuService
    {
        private readonly IdentityContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public MenuService(
            IdentityContext context,
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

        public async Task<GetListPagingResponse<ModelMenu>> GetList(GetListPagingRequest request)
        {
            var query = _context.Menus.AsQueryable();

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x => x.Name.Contains(request.TextSearch) || x.Controller.Contains(request.TextSearch));
            }

            query = query.Where(x => !x.IsDeleted);

            var totalRow = await query.CountAsync();
            
            var data = await query.OrderBy(x => x.Sort)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            return new GetListPagingResponse<ModelMenu>
            {
                Data = _mapper.Map<List<ModelMenu>>(data),
                TotalRow = totalRow,
                PageIndex = request.PageIndex,
                PageSize = request.PageSize
            };
        }
    }
}
