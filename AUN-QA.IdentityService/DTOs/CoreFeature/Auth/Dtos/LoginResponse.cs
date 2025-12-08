using AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos;

namespace AUN_QA.IdentityService.DTOs.CoreFeature.Auth.Dtos
{
    public class LoginResponse : ModelUser
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
    }
}
