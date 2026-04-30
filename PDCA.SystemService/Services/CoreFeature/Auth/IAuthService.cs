using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;
using AUN_QA.SystemService.DTOs.CoreFeature.RefreshToken.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.RefreshToken.Requests;

namespace AUN_QA.SystemService.Services.CoreFeature.Auth
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request, string ipAddress);
        ModelToken RefreshToken(RefreshTokenRequest request, string ipAddress);
    }
}
