using AutoMapper;
using AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.Criterion
{
    public class CriterionProfile : Profile
    {
        public CriterionProfile()
        {
            CreateMap<Entities.Criterion, ModelCriterion>()
                .ForMember(dest => dest.StandardName, opt => opt.Ignore());
            CreateMap<CriterionRequest, Entities.Criterion>();
        }
    }
}
