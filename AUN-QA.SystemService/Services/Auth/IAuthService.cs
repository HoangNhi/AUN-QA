using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;

namespace AUN_QA.SystemService.Services.Auth
{
    public interface IAuthService
    {
        LoginResponse Login(LoginRequest request);
    }
}
