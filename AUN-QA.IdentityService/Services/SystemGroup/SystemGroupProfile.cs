using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Requests;
using AutoMapper;

namespace AUN_QA.IdentityService.Services.SystemGroup
{
    public class SystemGroupProfile : Profile
    {
        public SystemGroupProfile()
        {
            CreateMap<Entities.SystemGroup, ModelSystemGroup>().ReverseMap();
            CreateMap<Entities.SystemGroup, SystemGroupRequest>().ReverseMap();
        }
    }
}
