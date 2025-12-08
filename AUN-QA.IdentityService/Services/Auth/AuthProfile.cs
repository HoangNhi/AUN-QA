using AUN_QA.IdentityService.DTOs.CoreFeature.Auth.Dtos;
using AutoMapper;

namespace AUN_QA.IdentityService.Services.Auth
{
    public class AuthProfile : Profile
    {
        public AuthProfile()
        {
            CreateMap<Entities.User, LoginResponse>().ReverseMap();
        }
    }
}
