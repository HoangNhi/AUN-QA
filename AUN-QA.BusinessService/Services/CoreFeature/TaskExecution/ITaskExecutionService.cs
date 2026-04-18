using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;

public interface ITaskExecutionService
{
    Task<GetListPagingResponse<TaskExecutionPlanListItemDto>> GetMyPlans(TaskExecutionGetPlansRequest request);

    Task<ActionPlanDetailDto> GetPlanDetail(Guid actionPlanId);

    Task<List<TaskExecutionTaskDto>> GetTaskList(TaskExecutionGetTaskListRequest request);

    Task<TaskExecutionTaskDto> InsertTask(TaskExecutionUpsertTaskRequest request);

    Task<TaskExecutionTaskDto> UpdateTask(TaskExecutionUpsertTaskRequest request);

    Task DeleteTask(TaskExecutionDeleteTaskRequest request);

    Task<List<TaskExecutionAttachmentDto>> UploadAttachment(TaskExecutionUploadAttachmentRequest request);

    Task DeleteAttachment(TaskExecutionDeleteAttachmentRequest request);
}
