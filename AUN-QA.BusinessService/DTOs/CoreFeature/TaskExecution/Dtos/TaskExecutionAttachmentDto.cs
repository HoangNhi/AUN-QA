namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;

public class TaskExecutionAttachmentDto
{
    public Guid Id { get; set; }

    public Guid ActionTaskId { get; set; }

    public Guid? AttachmentId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FileExtension { get; set; } = string.Empty;

    public string? FileUrl { get; set; }

    public double FileSize { get; set; }

    public DateTime UploadedAt { get; set; }

    public string UploadedBy { get; set; } = string.Empty;
}
