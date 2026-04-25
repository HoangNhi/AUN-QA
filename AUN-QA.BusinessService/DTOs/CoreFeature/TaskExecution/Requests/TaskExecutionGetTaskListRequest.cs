namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;

public class TaskExecutionGetTaskListRequest
{
    public Guid ActionPlanId { get; set; }

    public int PageIndex { get; set; } = 1;

    public int PageSize { get; set; } = 10;

    public string? TextSearch { get; set; }
}
