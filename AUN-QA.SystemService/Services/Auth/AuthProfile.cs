using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AutoMapper;

namespace AUN_QA.SystemService.Services.Auth
{
    public class AuthProfile : Profile
    {
        public AuthProfile()
        {
            CreateMap<Entities.User, LoginResponse>().ReverseMap();
        }
    }
}
