using AUN_QA.SystemService.Protos;
using AUN_QA.SystemService.Services.User;
using Grpc.Core;

namespace AUN_QA.SystemService.Services
{
    public class G_SystemService : SystemProto.SystemProtoBase
    {
        private readonly IUserService _userService;

        public G_SystemService(IUserService userService)
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
    }
}
