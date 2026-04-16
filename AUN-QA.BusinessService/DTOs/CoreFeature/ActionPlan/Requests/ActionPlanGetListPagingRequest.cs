using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;

public class ActionPlanGetListPagingRequest : GetListPagingRequest
{
    public Guid? CycleId { get; set; }

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public Guid? SourceFindingId { get; set; }

    public int? Status { get; set; }

    public int? Priority { get; set; }
}
