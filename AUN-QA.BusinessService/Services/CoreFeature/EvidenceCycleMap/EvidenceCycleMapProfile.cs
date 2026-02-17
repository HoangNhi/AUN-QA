using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap
{
    public class EvidenceCycleMapProfile : Profile
    {
        public EvidenceCycleMapProfile()
        {
            CreateMap<Entities.EvidenceCycleMap, ModelEvidenceCycleMap>().ReverseMap();
            CreateMap<Entities.EvidenceCycleMap, EvidenceCycleMapRequest>().ReverseMap();
        }
    }
}
