using AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.StandardSet
{
    public class StandardSetProfile : Profile
    {
        public StandardSetProfile()
        {
            CreateMap<Entities.StandardSet, ModelStandardSet>().ReverseMap();
            CreateMap<StandardSetRequest, Entities.StandardSet>().ReverseMap();
        }
    }
}
