using AUN_QA.IdentityService.DTOs.CoreFeature.Menu.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.Menu.Requests;
using AutoMapper;

namespace AUN_QA.IdentityService.Services.Menu
{
    public class MenuProfile : Profile
    {
        public MenuProfile()
        {
            CreateMap<Entities.Menu, ModelMenu>().ReverseMap();
            CreateMap<Entities.Menu, MenuRequest>().ReverseMap();
        }
    }
}
