using AUN_QA.SystemService.Protos;
using AUN_QA.SystemService.Services.CoreFeature.User;
using AUN_QA.SystemService.Infrastructure.Data;
using AUN_QA.SystemService.Helpers;
using Grpc.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.SystemService.Services.SystemGrpc
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SystemGrpcService : SystemProto.SystemProtoBase
    {
        private readonly SystemContext _context;
        private readonly IUserService _userService;

        public SystemGrpcService(SystemContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        public override async Task<CheckActionResponse> CheckPermission(CheckPermissionRequest request, ServerCallContext context)
        {
            var permission = await _userService.CheckPermission(new DTOs.CoreFeature.User.Requests.CheckPermissionRequest
            {
                UserId = Guid.Parse(request.UserId),
                Controller = request.Controller,
                Action = request.Action
            });

            return new CheckActionResponse
            {
                Success = permission.HasPermission
            };
        }

        public override async Task<GetUsersByIdsResponse> GetUsersByIds(GetUsersByIdsRequest request, ServerCallContext context)
        {
            var ids = request.UserIds.Select(Guid.Parse).ToList();
            var users = await _userService.GetByIds(ids);

            var response = new GetUsersByIdsResponse();
            response.Users.AddRange(users.Select(u => new UserInfo
            {
                Id = u.Id.ToString(),
                Fullname = u.Fullname ?? string.Empty,
                Avatar = u.Avatar ?? string.Empty,
                IsActived = u.IsActived
            }));
            return response;
        }

        public override async Task<GetUsersByUsernamesResponse> GetUsersByUsernames(GetUsersByUsernamesRequest request, ServerCallContext context)
        {
            var users = await _userService.GetByUsernames(request.Usernames.ToList());

            var response = new GetUsersByUsernamesResponse();
            response.Users.AddRange(users.Select(u => new UserInfo
            {
                Id = u.Id.ToString(),
                Fullname = u.Fullname ?? string.Empty,
                Avatar = u.Avatar ?? string.Empty,
                Username = u.Username ?? string.Empty,
                IsActived = u.IsActived,
            }));
            return response;
        }

        public override async Task<SetUsersActivedResponse> SetUsersActived(SetUsersActivedRequest request, ServerCallContext context)
        {
            var userIds = request.UserIds
                .Select(id => Guid.TryParse(id, out var value) ? value : (Guid?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            if (userIds.Count == 0)
            {
                return new SetUsersActivedResponse { Success = true };
            }

            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .ToListAsync();

            foreach (var user in users)
            {
                user.IsActived = request.IsActived;
            }

            await _context.SaveChangesAsync();

            return new SetUsersActivedResponse { Success = true };
        }

        public override async Task<CreateExternalUserResponse> CreateExternalUser(
            CreateExternalUserRequest request, ServerCallContext context)
        {
            var exists = await _context.Users.AnyAsync(x =>
                (x.Username == request.Username || x.Email == request.Email) && !x.IsDeleted);

            if (exists)
            {
                return new CreateExternalUserResponse
                {
                    Success = false,
                    Message = "Tên đăng nhập hoặc email đã tồn tại."
                };
            }

            if (!Guid.TryParse(request.RoleId, out var roleId))
            {
                return new CreateExternalUserResponse
                {
                    Success = false,
                    Message = "RoleId không hợp lệ."
                };
            }

            var salt = Encrypt_DecryptHelper.GenerateSalt();
            var user = new Entities.User
            {
                Id = Guid.NewGuid(),
                Username = request.Username.Trim(),
                Fullname = request.Fullname.Trim(),
                Email = request.Email.Trim(),
                Password = Encrypt_DecryptHelper.EncodePassword(request.Password, salt),
                PasswordSalt = salt,
                RoleId = roleId,
                IsActived = true,
                IsDeleted = false,
                CreatedBy = "System",
                CreatedAt = DateTime.UtcNow,
                Avatar = string.Empty
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return new CreateExternalUserResponse
            {
                Id = user.Id.ToString(),
                Success = true
            };
        }
    }
}
