using AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AUN_QA.IdentityService.Helpers
{
    public static class JWTHelper
    {
        public static string GenerateJwtToken(ModelUser User, IConfiguration Config)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Config["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[] {
                new Claim(JwtRegisteredClaimNames.Name, User.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, User.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            var token = new JwtSecurityToken(
                Config["Jwt:Issuer"],
                Config["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddHours(int.Parse(Config["Jwt:Expiry"])),
                signingCredentials: credentials
            );

            return tokenHandler.WriteToken(token);
        }

    }
}
