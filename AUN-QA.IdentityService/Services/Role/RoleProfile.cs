using AUN_QA.IdentityService.DTOs.CoreFeature.Role.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Role.Requests;
using AutoMapper;

namespace AUN_QA.IdentityService.Services.Role
{
    public class RoleProfile : Profile
    {
        public RoleProfile()
        {
            CreateMap<Entities.Role, ModelRole>().ReverseMap();
            CreateMap<Entities.Role, ModelRoleGetListPaging>().ReverseMap();
            CreateMap<Entities.Role, RoleRequest>().ReverseMap();
        }
    }
}
