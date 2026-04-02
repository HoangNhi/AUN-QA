using AUN_QA.SystemService.Protos;
using AUN_QA.SystemService.Services.CoreFeature.User;
using Grpc.Core;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;

namespace AUN_QA.SystemService.Services.SystemGrpc
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SystemGrpcService : SystemProto.SystemProtoBase
    {
        private readonly IUserService _userService;

        public SystemGrpcService(IUserService userService)
        {
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
                Avatar = u.Avatar ?? string.Empty
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
            }));
            return response;
        }
    }
}
