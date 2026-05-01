namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;

public class ActionPlanExternalFindingRequest
{
    public Guid? CycleId { get; set; }

    public string? TextSearch { get; set; }

    public Guid? CurrentActionPlanId { get; set; }
}
