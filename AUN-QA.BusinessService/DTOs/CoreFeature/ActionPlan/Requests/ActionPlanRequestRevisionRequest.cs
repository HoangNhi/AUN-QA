using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;

public class ActionPlanRequestRevisionRequest
{
    public Guid Id { get; set; }

    public string Reason { get; set; } = string.Empty;
}

public class ActionPlanRequestRevisionRequestValidator : AbstractValidator<ActionPlanRequestRevisionRequest>
{
    public ActionPlanRequestRevisionRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000).WithMessage("Lý do chỉnh sửa không được để trống");
    }
}
