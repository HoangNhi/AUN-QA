using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation
{
    public class CriterionEvaluationProfile : Profile
    {
        public CriterionEvaluationProfile()
        {
            CreateMap<Entities.EvaluationSubmission, EvaluationSubmissionRequest>().ReverseMap();
            CreateMap<Entities.EvaluationSubmission, ModelEvaluationSubmission>().ReverseMap();
        }
    }
}
