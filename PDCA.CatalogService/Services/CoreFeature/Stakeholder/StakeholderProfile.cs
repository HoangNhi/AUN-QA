using AUN_QA.CatalogService.DTOs.CoreFeature.Stakeholder.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Stakeholder.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.Stakeholder
{
    public class StakeholderProfile : Profile
    {
        public StakeholderProfile()
        {
            CreateMap<Entities.Stakeholder, ModelStakeholder>();
            CreateMap<Entities.Stakeholder, ModelStakeholderGetListPaging>();
            CreateMap<StakeholderRequest, Entities.Stakeholder>();
        }
    }
}
