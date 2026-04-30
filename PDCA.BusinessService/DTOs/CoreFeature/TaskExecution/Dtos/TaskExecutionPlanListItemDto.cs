namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;

public class TaskExecutionPlanListItemDto
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string CycleName { get; set; } = string.Empty;

    public int Year { get; set; }

    public string Title { get; set; } = string.Empty;

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public int Priority { get; set; }

    public DateTime Deadline { get; set; }

    public int Status { get; set; }

    public string? AssignedToNames { get; set; }

    public string? StatusName { get; set; }

    public int TotalTaskCount { get; set; }

    public int DoneTaskCount { get; set; }
}
