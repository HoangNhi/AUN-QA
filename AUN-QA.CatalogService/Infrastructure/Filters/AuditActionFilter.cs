using System.Text.Json;
using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.Protos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AUN_QA.CatalogService.Infrastructure.Filters;

public class AuditActionFilter : IAsyncActionFilter
{
    private readonly AuditProto.AuditProtoClient _auditClient;
    private readonly ILogger<AuditActionFilter> _logger;

    private static readonly HashSet<string> AuditableMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        "POST", "PUT", "DELETE"
    };

    private static readonly HashSet<string> SkipActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "get-list", "get-by-id", "get-all-combobox", "get-user-in-cycle"
    };

    private static readonly Dictionary<string, string> ActionMap = new(StringComparer.OrdinalIgnoreCase)
    {
        { "insert", "CREATE" },
        { "update", "UPDATE" },
        { "delete-list", "DELETE" },
        { "add-users-to-cycle", "ADD_USERS_TO_CYCLE" },
        { "remove-user-from-cycle", "REMOVE_USER_FROM_CYCLE" }
    };

    public AuditActionFilter(AuditProto.AuditProtoClient auditClient, ILogger<AuditActionFilter> logger)
    {
        _auditClient = auditClient;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpMethod = context.HttpContext.Request.Method;
        if (!AuditableMethods.Contains(httpMethod)) { await next(); return; }

        var routeName = GetRouteName(context);
        if (SkipActions.Contains(routeName)) { await next(); return; }

        var auditAction = ResolveAction(routeName, httpMethod);
        context.HttpContext.Items["AuditAction"] = auditAction;

        var requestBody = CaptureRequestBody(context);
        var controllerName = GetControllerName(context);

        var executedContext = await next();

        if (IsFailedResponse(executedContext))
        {
            var httpContext = context.HttpContext;
            var request = new WriteAuditLogRequest
            {
                UserId = httpContext.User?.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "",
                UserName = httpContext.User?.Claims.FirstOrDefault(c => c.Type == "username")?.Value ?? "Unknown",
                Action = auditAction,
                EntityName = controllerName,
                EntityId = "",
                OldValues = "",
                NewValues = requestBody ?? "",
                IpAddress = GetIpAddress(httpContext),
                ServiceName = "CatalogService",
                IsSuccess = false,
                ErrorMessage = ExtractErrorMessage(executedContext) ?? "Unknown error"
            };

            _ = Task.Run(async () =>
            {
                try { await _auditClient.WriteAuditLogAsync(request); }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to send failed-operation audit"); }
            });
        }
    }

    private static string ResolveAction(string routeName, string httpMethod)
    {
        if (ActionMap.TryGetValue(routeName, out var mapped)) return mapped;
        if (routeName.Contains("delete", StringComparison.OrdinalIgnoreCase)) return "DELETE";
        if (routeName.Contains("insert", StringComparison.OrdinalIgnoreCase)) return "CREATE";
        if (routeName.Contains("update", StringComparison.OrdinalIgnoreCase)) return "UPDATE";
        return httpMethod switch { "POST" => "CREATE", "PUT" => "UPDATE", "DELETE" => "DELETE", _ => "UNKNOWN" };
    }

    private static bool IsFailedResponse(ActionExecutedContext ctx)
    {
        if (ctx.Exception != null && !ctx.ExceptionHandled) return true;
        if (ctx.Result is ObjectResult obj && obj.Value != null)
        {
            var t = obj.Value.GetType();
            if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(BaseResponse<>))
                return (bool?)t.GetProperty("Success")?.GetValue(obj.Value) == false;
            // Also handle non-generic BaseResponse just in case
            if (obj.Value is BaseResponse br) return !br.Success;
        }
        return ctx.Result is ForbidResult;
    }

    private static string? ExtractErrorMessage(ActionExecutedContext ctx)
    {
        if (ctx.Exception != null) return ctx.Exception.Message;
        if (ctx.Result is ObjectResult obj && obj.Value != null)
        {
            var t = obj.Value.GetType();
            if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(BaseResponse<>))
                return t.GetProperty("Message")?.GetValue(obj.Value)?.ToString();
            if (obj.Value is BaseResponse br) return br.Message;
        }
        if (ctx.Result is ForbidResult) return "Không có quyền thực hiện thao tác này";
        return null;
    }

    private static string? CaptureRequestBody(ActionExecutingContext ctx)
    {
        if (ctx.ActionArguments.Count == 0) return null;
        try { return JsonSerializer.Serialize(ctx.ActionArguments); } catch { return null; }
    }

    private static string GetControllerName(ActionExecutingContext ctx)
        => ((ControllerActionDescriptor)ctx.ActionDescriptor).ControllerName;

    private static string GetRouteName(ActionExecutingContext ctx)
    {
        var d = ctx.ActionDescriptor as ControllerActionDescriptor;
        return d?.MethodInfo.GetCustomAttributes(typeof(RouteAttribute), false)
            .OfType<RouteAttribute>().FirstOrDefault()?.Template ?? d?.ActionName ?? "";
    }

    private static string GetIpAddress(HttpContext ctx)
    {
        var f = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(f)) return f.Split(',').FirstOrDefault()?.Trim() ?? "";
        return ctx.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "";
    }
}
