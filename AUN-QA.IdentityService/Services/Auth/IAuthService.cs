using AUN_QA.IdentityService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Auth.Requests;

namespace AUN_QA.IdentityService.Services.Auth
{
    public interface IAuthService
    {
        LoginResponse Login(LoginRequest request);
    }
}
