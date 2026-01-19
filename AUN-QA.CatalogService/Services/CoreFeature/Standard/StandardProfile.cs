using AutoMapper;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.Standard
{
    public class StandardProfile : Profile
    {
        public StandardProfile()
        {
            CreateMap<Entities.Standard, ModelStandard>();
            CreateMap<StandardRequest, Entities.Standard>();
        }
    }
}
