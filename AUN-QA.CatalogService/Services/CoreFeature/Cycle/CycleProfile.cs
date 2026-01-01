using AUN_QA.CatalogService.DTOs.CoreFeature.Council;
using AUN_QA.CatalogService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.Cycle
{
    public class CycleProfile : Profile
    {
        public CycleProfile()
        {
            CreateMap<Entities.Cycle, ModelCycle>().ReverseMap();
            CreateMap<Entities.Cycle, CycleRequest>().ReverseMap();
            CreateMap<Entities.Cycle, ModelCycleGetListPaging>().ReverseMap();

            CreateMap<Entities.Council, ModelCouncil>().ReverseMap();
            CreateMap<Entities.Council, CouncilRequest>().ReverseMap();

            CreateMap<Entities.EvaluationSchedule, ModelEvaluationSchedule>().ReverseMap();
            CreateMap<Entities.EvaluationSchedule, EvaluationScheduleRequest>().ReverseMap();
        }
    }
}
