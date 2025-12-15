using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.Common;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;
using AUN_QA.SystemService.Services.Auth;
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
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.Login(request);
            return Ok(new BaseResponse<LoginResponse> { Data = result, Success = true });
        }
    }
}
