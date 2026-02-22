using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.Shared.Common;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;
using AUN_QA.SystemService.DTOs.CoreFeature.RefreshToken.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.RefreshToken.Requests;
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

        public AuthController(IAuthService service)
        {
            _service = service;
        }

        [HttpPost, Route("login")]
        [AllowAnonymous]
        public IActionResult Login(LoginRequest request)
        {
            var result = _service.Login(request, GetClientIpAddress());
            return Ok(new BaseResponse<LoginResponse> { Data = result, Success = true });
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
