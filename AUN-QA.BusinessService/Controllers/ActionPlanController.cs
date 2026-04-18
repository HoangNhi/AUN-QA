using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ActionPlanController : BaseController<ActionPlanController>
{
    private readonly IActionPlanService _service;

    public ActionPlanController(IActionPlanService service)
    {
        _service = service;
    }

    [HttpPost("get-list")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetList([FromBody] ActionPlanGetListPagingRequest request)
    {
        var result = await _service.GetList(request);
        return Ok(new BaseResponse<GetListPagingResponse<ActionPlanListItemDto>> { Data = result, Success = true });
    }

    [HttpGet("get-by-id")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
    {
        var result = await _service.GetById(request.Id!.Value);
        return Ok(new BaseResponse<ActionPlanDetailDto> { Data = result, Success = true });
    }

    [HttpPost("insert")]
    [AttributePermission(Action = ActionType.ADD)]
    public async Task<IActionResult> Insert([FromBody] ActionPlanUpsertRequest request)
    {
        var result = await _service.Insert(request);
        return Ok(new BaseResponse<ActionPlanDetailDto> { Data = result, Success = true });
    }

    [HttpPut("update")]
    [AttributePermission(Action = ActionType.UPDATE)]
    public async Task<IActionResult> Update([FromBody] ActionPlanUpsertRequest request)
    {
        var result = await _service.Update(request);
        return Ok(new BaseResponse<ActionPlanDetailDto> { Data = result, Success = true });
    }

    [HttpDelete("delete-list")]
    [AttributePermission(Action = ActionType.DELETE)]
    public async Task<IActionResult> DeleteList([FromBody] ActionPlanDeleteListRequest request)
    {
        await _service.DeleteList(request);
        return Ok(new BaseResponse(true, 200));
    }

    [HttpPost("get-external-review-findings")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetExternalReviewFindings([FromBody] ActionPlanExternalFindingRequest request)
    {
        var result = await _service.GetExternalReviewFindings(request);
        return Ok(new BaseResponse<List<ExternalFindingOptionDto>> { Data = result, Success = true });
    }

    [HttpGet("assignable-members")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetAssignableMembers([FromQuery] Guid cycleId)
    {
        var result = await _service.GetAssignableMembers(cycleId);
        return Ok(new BaseResponse<List<AssignableMemberDto>> { Data = result, Success = true });
    }

    [HttpGet("assignable-users-combobox")]
    [AttributePermission(Action = ActionType.VIEW)]
    public async Task<IActionResult> GetAssignableUsersCombobox()
    {
        var result = await _service.GetAssignableUsersCombobox();
        return Ok(new BaseResponse<List<AssignableMemberDto>> { Data = result, Success = true });
    }

    [HttpGet("my-council-role")]
    [AttributePermission(Action = ActionType.NONE)]
    public async Task<IActionResult> GetMyCouncilRole([FromQuery] Guid cycleId)
    {
        var roleId = await _service.GetMyCouncilRoleId(cycleId);
        return Ok(new BaseResponse<int> { Data = roleId, Success = true });
    }
}
