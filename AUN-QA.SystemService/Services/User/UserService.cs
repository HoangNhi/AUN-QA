using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Requests;
using AUN_QA.SystemService.Helpers;
using AUN_QA.SystemService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using Npgsql;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.SystemService.Services.User
{
    [RegisterClassAsTransient]
    public class UserService : IUserService
    {
        private const string DefaultPassword = "b86e09fa-0751";
        private readonly SystemContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public UserService(
            SystemContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public async Task<ModelUser> GetById(GetByIdRequest request)
        {
            var data = await _context.Users.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelUser>(data);
            result.Password = DefaultPassword;

            return result;
        }

        public async Task<ModelUser> GetCurrentUser()
        {
            var userId = _contextAccessor.HttpContext?.User?.Claims.FirstOrDefault(x => x.Type == "name")?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                throw new Exception("Người dùng chưa xác thực");
            }
            var data = await _context.Users.FirstOrDefaultAsync(x => x.Id == Guid.Parse(userId) && !x.IsDeleted && x.IsActived);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }
            var result = _mapper.Map<ModelUser>(data);
            return result;
        }

        public async Task<ModelUser> Insert(UserRequest request)
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

            await _context.Users.AddAsync(add);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelUser>(add);
        }

        public async Task<ModelUser> Update(UserRequest request)
        {
            var data = _context.Users.Where(x =>
                x.Username == request.Username
                && !x.IsDeleted && x.Id != request.Id);

            if (data.Any())
            {
                throw new Exception("Tên đăng nhập đã tồn tại");
            }

            var update = await _context.Users.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            if (request.Password != DefaultPassword)
            {
                update.Password = Encrypt_DecryptHelper.EncodePassword(request.Password, update.PasswordSalt);
            }

            update.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
            update.UpdatedAt = DateTime.Now;
            _context.Users.Update(update);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelUser>(update);
        }

        public async Task<string> DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.Users.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext?.User?.Identity?.Name ?? "System";
                delete.UpdatedAt = DateTime.Now;

                _context.Users.Update(delete);
            }

            await _context.SaveChangesAsync();
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

            var result = await _context.ExecuteFunction<GetListPagingResponse<ModelUser>>("fn_user_getlistpaging", parameters);
            return result;
        }

        public async Task<CheckPermissionReponse> CheckPermission(CheckPermissionRequest request)
        {
            var parameters = new[]
            {
                new NpgsqlParameter("i_user_id", request.UserId),
                new NpgsqlParameter("i_controller", request.Controller),
                new NpgsqlParameter("i_action", ((int)request.Action))
            };

            var result = await _context.ExecuteFunction<CheckPermissionReponse>("fn_user_checkpermission", parameters);
            return result;
        }
    }
}
