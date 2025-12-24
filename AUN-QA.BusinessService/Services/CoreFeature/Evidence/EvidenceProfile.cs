using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.Evidence
{
    public class EvidenceProfile : Profile
    {
        public EvidenceProfile()
        {
            CreateMap<Entities.Evidence, ModelEvidence>().ReverseMap();
            CreateMap<Entities.Evidence, EvidenceRequest>().ReverseMap();
        }
    }
}
