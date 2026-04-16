namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;

public class ActionPlanListItemDto
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string CycleName { get; set; } = string.Empty;

    public int Year { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public int Priority { get; set; }

    public DateTime Deadline { get; set; }

    public string Kpi { get; set; } = string.Empty;

    public int Status { get; set; }

    public int AssigneeCount { get; set; }

    public int TotalTaskCount { get; set; }

    public int DoneTaskCount { get; set; }

    public string? StatusName { get; set; }

    public string? PriorityName { get; set; }
}
