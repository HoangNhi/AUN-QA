namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;

public class TaskExecutionTaskDto
{
    public Guid Id { get; set; }

    public Guid ActionPlanId { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? Note { get; set; }

    public int TaskStatus { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string CreatedBy { get; set; } = string.Empty;

    public List<TaskExecutionAttachmentDto> Attachments { get; set; } = new();
}
