using AUN_QA.BusinessService.DTOs.CoreFeature.Council;
using AUN_QA.BusinessService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvaluationSchedule.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvaluationSchedule.Requests;
using AutoMapper;
using System.Text.Json;

namespace AUN_QA.BusinessService.Services.CoreFeature.Cycle
{
    public class CycleProfile : Profile
    {
        public CycleProfile()
        {
            CreateMap<Entities.Cycle, ModelCycle>().ReverseMap();
            CreateMap<Entities.Cycle, CycleRequest>().ReverseMap();
            CreateMap<Entities.Cycle, ModelCycleGetListPaging>().ReverseMap();

            // Council → CouncilRequest: deserialize AssignedStandards JSON → List<Guid>
            CreateMap<Entities.Council, CouncilRequest>()
                .ForMember(dest => dest.AssignedStandardIds, opt => opt.MapFrom((src, dest, destMember, context) =>
                    string.IsNullOrEmpty(src.AssignedStandards)
                        ? new List<Guid>()
                        : JsonSerializer.Deserialize<List<Guid>>(src.AssignedStandards)))
                .ReverseMap()
                .ForMember(dest => dest.AssignedStandards, opt => opt.MapFrom((src, dest, destMember, context) =>
                    src.AssignedStandardIds != null && src.AssignedStandardIds.Count > 0
                        ? JsonSerializer.Serialize(src.AssignedStandardIds)
                        : null));

            // Council → ModelCouncil: deserialize AssignedStandards JSON → List<Guid>
            CreateMap<Entities.Council, ModelCouncil>()
                .ForMember(dest => dest.AssignedStandardIds, opt => opt.MapFrom((src, dest, destMember, context) =>
                    string.IsNullOrEmpty(src.AssignedStandards)
                        ? new List<Guid>()
                        : JsonSerializer.Deserialize<List<Guid>>(src.AssignedStandards)));

            CreateMap<Entities.EvaluationSchedule, ModelEvaluationSchedule>().ReverseMap();
            CreateMap<Entities.EvaluationSchedule, EvaluationScheduleRequest>().ReverseMap();
        }
    }
}
