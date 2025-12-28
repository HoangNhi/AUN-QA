using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.SystemService.Protos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AUN_QA.BusinessService.Helpers
{
    public class AttributePermission : Attribute, IAsyncAuthorizationFilter
    {
        public ActionType Action { get; set; }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            try
            {
                if (Action == ActionType.NONE) return;

                // 1. Get UserID from Claims
                var userId = context.HttpContext.User.Claims.FirstOrDefault(x => x.Type == "name")?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    throw new Exception();
                }

                var controllerName = ((Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor)context.ActionDescriptor).ControllerName.ToLower();

                // 2. Resolve Client from DI
                var client = context.HttpContext.RequestServices.GetRequiredService<SystemProto.SystemProtoClient>();

                // 3. Call gRPC
                var response = await client.CheckPermissionAsync(new CheckPermissionRequest
                {
                    UserId = userId,
                    Controller = controllerName,
                    Action = ((int)Action)
                });

                if (!response.Success)
                {
                    context.Result = new ForbidResult();
                }
            }
            catch (Exception)
            {
                var response = new BaseResponse<string>
                {
                    Success = false,
                    StatusCode = 403,
                    Message = "Bạn không có quyền truy cập"
                };
                context.Result = new JsonResult(response);
            }
        }
    }
}
