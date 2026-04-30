using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;

public interface ITaskExecutionService
{
    Task<GetListPagingResponse<TaskExecutionPlanListItemDto>> GetMyPlans(TaskExecutionGetPlansRequest request);

    Task<TaskExecutionPlanDetailDto> GetPlanDetail(Guid actionPlanId);

    Task<TaskExecutionTaskListResponseDto> GetTaskList(TaskExecutionGetTaskListRequest request);

    Task<TaskExecutionTaskDto> GetTaskDetail(Guid taskId);

    Task<TaskExecutionTaskDto> InsertTask(TaskExecutionUpsertTaskRequest request);

    Task<TaskExecutionTaskDto> UpdateTask(TaskExecutionUpsertTaskRequest request);

    Task DeleteTask(TaskExecutionDeleteTaskRequest request);

    Task<ModelFilePreview> PreviewTaskAttachment(Guid attachmentId, string mode);
}
