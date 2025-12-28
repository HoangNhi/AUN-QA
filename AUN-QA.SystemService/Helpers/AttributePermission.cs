using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.Common;
using AUN_QA.SystemService.Services.User;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AUN_QA.SystemService.Helpers
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
                var userService = context.HttpContext.RequestServices.GetRequiredService<IUserService>();

                var response = await userService.CheckPermission(new DTOs.CoreFeature.User.Requests.CheckPermissionRequest
                {
                    UserId = Guid.Parse(userId),
                    Controller = controllerName,
                    Action = ((int)Action)
                });

                if (!response.HasPermission)
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
