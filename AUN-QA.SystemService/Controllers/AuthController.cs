using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.Shared.Common;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;
using AUN_QA.SystemService.DTOs.CoreFeature.RefreshToken.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.RefreshToken.Requests;
using AUN_QA.SystemService.Entities;
using AUN_QA.SystemService.Infrastructure.Services;
using AUN_QA.SystemService.Services.CoreFeature.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.SystemService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : BaseController<AuthController>
    {
        private readonly IAuthService _service;
        private readonly IAuditLogWriter _auditWriter;

        public AuthController(IAuthService service, IAuditLogWriter auditWriter)
        {
            _service = service;
            _auditWriter = auditWriter;
        }

        [HttpPost, Route("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var ipAddress = GetClientIpAddress();
            try
            {
                var result = _service.Login(request, ipAddress);

                await _auditWriter.WriteAsync(new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = result.Id,
                    UserName = request.Username,
                    Action = "LOGIN",
                    EntityName = "Auth",
                    EntityId = result.Id.ToString(),
                    OldValues = null,
                    NewValues = null,
                    IpAddress = ipAddress,
                    ServiceName = "SystemService",
                    IsSuccess = true,
                    ErrorMessage = null,
                    CreatedAt = DateTime.UtcNow
                });

                return Ok(new BaseResponse<LoginResponse> { Data = result, Success = true });
            }
            catch (Exception ex)
            {
                await _auditWriter.WriteAsync(new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = Guid.Empty,
                    UserName = request.Username,
                    Action = "LOGIN",
                    EntityName = "Auth",
                    EntityId = null,
                    OldValues = null,
                    NewValues = null,
                    IpAddress = ipAddress,
                    ServiceName = "SystemService",
                    IsSuccess = false,
                    ErrorMessage = ex.Message,
                    CreatedAt = DateTime.UtcNow
                });

                throw;
            }
        }

        [HttpPost, Route("logout")]
        public async Task<IActionResult> Logout()
        {
            var userId = User?.Claims.FirstOrDefault(c => c.Type == "name")?.Value;
            var userName = User?.Claims.FirstOrDefault(c => c.Type == "unique_name")?.Value ?? "Unknown";

            await _auditWriter.WriteAsync(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = Guid.TryParse(userId, out var uid) ? uid : Guid.Empty,
                UserName = userName,
                Action = "LOGOUT",
                EntityName = "Auth",
                EntityId = userId,
                OldValues = null,
                NewValues = null,
                IpAddress = GetClientIpAddress(),
                ServiceName = "SystemService",
                IsSuccess = true,
                ErrorMessage = null,
                CreatedAt = DateTime.UtcNow
            });

            return Ok(new BaseResponse<object> { Data = null, Success = true, Message = "Đăng xuất thành công" });
        }

        [HttpPost, Route("refresh-token")]
        [AllowAnonymous]
        public IActionResult RefreshToken(RefreshTokenRequest request)
        {
            var result = _service.RefreshToken(request, GetClientIpAddress());
            return Ok(new BaseResponse<ModelToken> { Data = result, Success = true });
        }
    }
}
