namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;

public class TaskExecutionUploadAttachmentRequest
{
    public Guid TaskId { get; set; }

    public string FolderUpload { get; set; } = string.Empty;
}
