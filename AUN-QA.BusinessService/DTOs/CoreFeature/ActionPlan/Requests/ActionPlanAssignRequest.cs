using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;

public class ActionPlanAssignRequest
{
    public Guid Id { get; set; }

    public List<Guid> AssignedTo { get; set; } = new();
}

public class ActionPlanAssignRequestValidator : AbstractValidator<ActionPlanAssignRequest>
{
    public ActionPlanAssignRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.AssignedTo).NotEmpty().WithMessage("Danh sách người thực hiện không được để trống");
    }
}
