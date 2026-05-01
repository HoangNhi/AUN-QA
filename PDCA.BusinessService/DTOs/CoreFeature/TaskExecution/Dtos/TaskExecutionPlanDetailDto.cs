using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;

public class TaskExecutionPlanDetailDto
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public int Priority { get; set; }

    public DateTime Deadline { get; set; }

    public int Status { get; set; }

    public Guid? SourceFindingId { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? CompletedBy { get; set; }

    public List<ActionPlanAssigneeDto> Assignees { get; set; } = new();

    public List<ModelAttachment> Attachments { get; set; } = new();
}
