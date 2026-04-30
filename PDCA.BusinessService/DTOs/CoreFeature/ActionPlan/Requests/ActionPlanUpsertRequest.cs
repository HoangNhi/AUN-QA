using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;

public class ActionPlanUpsertRequest : BaseRequest
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public int Priority { get; set; } = 2;

    public DateTime Deadline { get; set; }

    public Guid? SourceFindingId { get; set; }

    public List<Guid> AssignedTo { get; set; } = new();

    public int Status { get; set; } = 1;

    public List<Guid> AttachmentIds { get; set; } = new();
}

public class ActionPlanUpsertRequestValidator : AbstractValidator<ActionPlanUpsertRequest>
{
    public ActionPlanUpsertRequestValidator()
    {
        RuleFor(x => x.CycleId).NotEmpty().WithMessage("Chu kỳ không được để trống");
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500).WithMessage("Tên kế hoạch không được để trống");
        RuleFor(x => x.Deadline).NotEmpty().WithMessage("Thời hạn không được để trống");
        RuleFor(x => x.Priority).InclusiveBetween(1, 3).WithMessage("Ưu tiên không hợp lệ");
        RuleFor(x => x.Status).InclusiveBetween(1, 4).WithMessage("Trạng thái không hợp lệ");
    }
}
