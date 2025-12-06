using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace AUN_QA.AssessmentService.DTOs.Base
{
    //[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class BaseController<T> : ControllerBase
    {
        [NonAction]
        public string GetClientIpAddress()
        {
            if (HttpContext == null)
                return null;

            // 1?? Try X-Forwarded-For (can contain multiple IPs)
            var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                // Sometimes contains multiple IPs, e.g. "203.0.113.195, 70.41.3.18, 150.172.238.178"
                var ip = forwardedFor.Split(',').FirstOrDefault()?.Trim();
                if (IPAddress.TryParse(ip, out var realIp))
                    return realIp.MapToIPv4().ToString();
            }

            // 2?? Try X-Real-IP (some proxies use this instead)
            var realIpHeader = HttpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIpHeader) && IPAddress.TryParse(realIpHeader, out var realIp2))
            {
                return realIp2.MapToIPv4().ToString();
            }

            // 3?? Fallback: Direct connection IP
            var remoteIp = HttpContext.Connection.RemoteIpAddress;
            if (remoteIp != null)
                return remoteIp.MapToIPv4().ToString();

            return null;
        }
    }
}
