using AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.User.Requests;
using AutoMapper;

namespace AUN_QA.IdentityService.Services.User
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<Entities.User, ModelUser>().ReverseMap();
            CreateMap<Entities.User, UserRequest>().ReverseMap();
        }
    }
}
