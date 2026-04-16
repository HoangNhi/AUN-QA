using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Requests;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;

public interface IActionPlanService
{
    Task<GetListPagingResponse<ActionPlanListItemDto>> GetList(ActionPlanGetListPagingRequest request);

    Task<ActionPlanDetailDto> GetById(Guid id);

    Task<ActionPlanDetailDto> Insert(ActionPlanUpsertRequest request);

    Task<ActionPlanDetailDto> Update(ActionPlanUpsertRequest request);

    Task DeleteList(ActionPlanDeleteListRequest request);

    Task Submit(ActionPlanSubmitRequest request);

    Task Approve(ActionPlanApproveRequest request);

    Task RequestRevision(ActionPlanRequestRevisionRequest request);

    Task Assign(ActionPlanAssignRequest request);

    Task<List<ExternalFindingOptionDto>> GetExternalReviewFindings(ActionPlanExternalFindingRequest request);
}
