using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;

public class ActionPlanUpdateTaskRequest
{
    public Guid Id { get; set; }

    public Guid ActionPlanId { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? Note { get; set; }

    public int TaskStatus { get; set; } = 2;

    public DateTime? DueDate { get; set; }

    public string? FolderUpload { get; set; }
}

public class ActionPlanUpdateTaskRequestValidator : AbstractValidator<ActionPlanUpdateTaskRequest>
{
    public ActionPlanUpdateTaskRequestValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id công việc không được để trống");
        RuleFor(x => x.ActionPlanId).NotEmpty().WithMessage("Id kế hoạch không được để trống");
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000)
            .WithMessage("Mô tả công việc không được để trống");
        RuleFor(x => x.TaskStatus).InclusiveBetween(1, 4)
            .WithMessage("Trạng thái công việc không hợp lệ");
    }
}
