namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;

public class ActionPlanDetailDto
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public int Priority { get; set; }

    public DateTime Deadline { get; set; }

    public string Kpi { get; set; } = string.Empty;

    public int Status { get; set; }

    public Guid? SourceFindingId { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public string? SubmittedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovedBy { get; set; }

    public DateTime? RevisionRequestedAt { get; set; }

    public string? RevisionRequestedBy { get; set; }

    public string? RevisionReason { get; set; }

    public DateTime? AssignedAt { get; set; }

    public string? AssignedBy { get; set; }

    public List<ActionPlanAssigneeDto> Assignees { get; set; } = new();

    public List<ActionTaskDto> Tasks { get; set; } = new();
}
