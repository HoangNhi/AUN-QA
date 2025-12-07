using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Requests;
using AUN_QA.IdentityService.Helpers;
using AUN_QA.IdentityService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Npgsql;

namespace AUN_QA.IdentityService.Services.User
{
    [RegisterClassAsTransient]
    public class UserService : IUserService
    {
        private readonly IdentityContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public UserService(
            IdentityContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public ModelUser GetById(GetByIdRequest request)
        {
            var data = _context.Users.Find(request.Id);
            if (data == null)
            {
                throw new Exception("Not found");
            }

            var result = _mapper.Map<ModelUser>(data);
            result.Password = "Abc@123";

            return result;
        }

        public ModelUser Insert(UserRequest request)
        {
            var data = _context.Users.Where(x =>
                x.Username == request.Username
                && !x.IsDeleted
            );

            if (data.Any())
            {
                throw new Exception("Tên đăng nhập đã tồn tại");
            }

            var add = _mapper.Map<Entities.User>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.PasswordSalt = Encrypt_DecryptHelper.GenerateSalt();
            add.Password = Encrypt_DecryptHelper.EncodePassword(request.Password, add.PasswordSalt);
            add.CreatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            add.CreatedAt = DateTime.Now;

            _context.Users.Add(add);
            _context.SaveChanges();

            return _mapper.Map<ModelUser>(add);
        }

        public ModelUser Update(UserRequest request)
        {
            var data = _context.Users.Where(x =>
                x.Username == request.Username
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên đăng nhập đã tồn tại");
            }

            var update = _context.Users.Find(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            if (request.Password != "Abc@123")
            {
                update.Password = Encrypt_DecryptHelper.EncodePassword(request.Password, update.PasswordSalt);
            }

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;
            _context.Users.Update(update);
            _context.SaveChanges();

            return _mapper.Map<ModelUser>(update);
        }

        public string DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = _context.Users.Find(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Users.Update(delete);
            }

            _context.SaveChanges();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelUser>> GetList(GetListPagingRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_textsearch", request.TextSearch),
                new NpgsqlParameter("i_pageindex", request.PageIndex - 1),
                new NpgsqlParameter("i_pagesize", request.PageSize),
            };

            var result = await _context.ExcutePagingFunction<ModelUser>("fn_user_getlistpaging", parameters);
            return result;
        }
    }
}
