using AUN_QA.Shared.DTOs.Base;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;

public class ActionPlanProfile : Profile
{
    public ActionPlanProfile()
    {
        CreateMap<Entities.ActionPlanAttachment, ModelAttachment>().ReverseMap();
    }
}
