namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;

public class TaskExecutionTaskListResponseDto
{
    public int PageIndex { get; set; }

    public int PageSize { get; set; }

    public int TotalRow { get; set; }

    public int DoneCount { get; set; }

    public List<TaskExecutionTaskDto> Data { get; set; } = new();
}
