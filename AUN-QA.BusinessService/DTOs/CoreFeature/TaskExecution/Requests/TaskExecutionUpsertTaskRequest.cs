using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;

public class TaskExecutionUpsertTaskRequest
{
    public Guid Id { get; set; }

    public Guid ActionPlanId { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? Note { get; set; }

    public int TaskStatus { get; set; } = 1;

    public DateTime? DueDate { get; set; }

    public string? FolderUpload { get; set; }
}

public class TaskExecutionUpsertTaskRequestValidator : AbstractValidator<TaskExecutionUpsertTaskRequest>
{
    public TaskExecutionUpsertTaskRequestValidator()
    {
        RuleFor(x => x.ActionPlanId).NotEmpty();
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000).WithMessage("Mô tả công việc không được để trống");
        RuleFor(x => x.TaskStatus).InclusiveBetween(1, 3).WithMessage("Trạng thái công việc không hợp lệ");
    }
}
