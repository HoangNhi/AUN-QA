using AUN_QA.BusinessService.DTOs.Base;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System.Text;

namespace AUN_QA.BusinessService.Configs
{
    public static class ConfigureAuthentication
    {
        public static void ExecuteConfigAuthentication(this WebApplicationBuilder builder)
        {
            builder.Services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                })
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),

                        ClockSkew = TimeSpan.Zero
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnChallenge = async context =>
                        {
                            context.HandleResponse();

                            context.Response.StatusCode = StatusCodes.Status200OK;
                            context.Response.ContentType = "application/json";

                            var response = new BaseResponse(false, 401, "Xác thực không thành công: token không hợp lệ hoặc bị thiếu");
                            var json = JsonConvert.SerializeObject(response);

                            await context.Response.WriteAsync(json);
                        },

                        OnForbidden = async context =>
                        {
                            context.Response.StatusCode = StatusCodes.Status200OK;
                            context.Response.ContentType = "application/json";

                            var response = new BaseResponse(false, 403, "Bạn không có quyền truy cập");
                            var json = JsonConvert.SerializeObject(response);

                            await context.Response.WriteAsync(json);
                        }
                    };
                });
        }
    }
}
