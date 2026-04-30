using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;

public class TaskExecutionGetPlansRequest : GetListPagingRequest
{
    public Guid? CycleId { get; set; }

    public int? Status { get; set; }
}
