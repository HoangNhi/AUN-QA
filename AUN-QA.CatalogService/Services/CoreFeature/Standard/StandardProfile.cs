using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.Standard
{
    public class StandardProfile : Profile
    {
        public StandardProfile()
        {
            CreateMap<Entities.Standard, ModelStandard>().ReverseMap();
            CreateMap<Entities.Standard, StandardRequest>().ReverseMap();

            CreateMap<Entities.Criterion, ModelCriterion>().ReverseMap();
            CreateMap<Entities.Criterion, CriterionRequest>().ReverseMap();
        }
    }
}
