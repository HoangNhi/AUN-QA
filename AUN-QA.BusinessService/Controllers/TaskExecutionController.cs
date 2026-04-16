using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TaskExecution.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.TaskExecution;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TaskExecutionController : BaseController<TaskExecutionController>
{
    private readonly ITaskExecutionService _service;

    public TaskExecutionController(ITaskExecutionService service)
    {
        _service = service;
    }

    [HttpGet("get-my-plans")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetMyPlans([FromQuery] TaskExecutionGetPlansRequest request)
    {
        var result = await _service.GetMyPlans(request);
        return Ok(new BaseResponse<GetListPagingResponse<TaskExecutionPlanListItemDto>> { Data = result, Success = true });
    }

    [HttpGet("get-all-plans")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetAllPlans([FromQuery] TaskExecutionGetPlansRequest request)
    {
        var result = await _service.GetAllPlans(request);
        return Ok(new BaseResponse<GetListPagingResponse<TaskExecutionPlanListItemDto>> { Data = result, Success = true });
    }

    [HttpGet("get-plan-detail")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetPlanDetail([FromQuery] GetByIdRequest request)
    {
        var result = await _service.GetPlanDetail(request.Id!.Value);
        return Ok(new BaseResponse<ActionPlanDetailDto> { Data = result, Success = true });
    }

    [HttpPost("get-task-list")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetTaskList([FromBody] TaskExecutionGetTaskListRequest request)
    {
        var result = await _service.GetTaskList(request);
        return Ok(new BaseResponse<List<TaskExecutionTaskDto>> { Data = result, Success = true });
    }

    [HttpPost("insert-task")]
    [AttributePermission(Action = ActionType.ADD)]
    public async Task<IActionResult> InsertTask([FromBody] TaskExecutionUpsertTaskRequest request)
    {
        var result = await _service.InsertTask(request);
        return Ok(new BaseResponse<TaskExecutionTaskDto> { Data = result, Success = true });
    }

    [HttpPut("update-task")]
    [AttributePermission(Action = ActionType.UPDATE)]
    public async Task<IActionResult> UpdateTask([FromBody] TaskExecutionUpsertTaskRequest request)
    {
        var result = await _service.UpdateTask(request);
        return Ok(new BaseResponse<TaskExecutionTaskDto> { Data = result, Success = true });
    }

    [HttpDelete("delete-task")]
    [AttributePermission(Action = ActionType.DELETE)]
    public async Task<IActionResult> DeleteTask([FromBody] TaskExecutionDeleteTaskRequest request)
    {
        await _service.DeleteTask(request);
        return Ok(new BaseResponse(true, 200));
    }

    [HttpPost("upload-task-attachment")]
    [AttributePermission(Action = ActionType.UPDATE)]
    public async Task<IActionResult> UploadTaskAttachment([FromBody] TaskExecutionUploadAttachmentRequest request)
    {
        var result = await _service.UploadAttachment(request);
        return Ok(new BaseResponse<List<TaskExecutionAttachmentDto>> { Data = result, Success = true });
    }

    [HttpDelete("delete-task-attachment")]
    [AttributePermission(Action = ActionType.DELETE)]
    public async Task<IActionResult> DeleteTaskAttachment([FromBody] TaskExecutionDeleteAttachmentRequest request)
    {
        await _service.DeleteAttachment(request);
        return Ok(new BaseResponse(true, 200));
    }
}
