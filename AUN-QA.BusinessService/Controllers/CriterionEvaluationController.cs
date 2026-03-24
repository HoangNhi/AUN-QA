using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CriterionEvaluationController : BaseController<CriterionEvaluationController>
    {
        private readonly ICriterionEvaluationService _service;

        public CriterionEvaluationController(ICriterionEvaluationService service)
        {
            _service = service;
        }

        [HttpPost("get-summary")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetSummary([FromBody] GetCriterionEvaluationSummaryRequest request)
        {
            var result = await _service.GetSummary(request);
            return Ok(new BaseResponse<ModelCriterionEvaluationSummary> { Data = result, Success = true });
        }

        [HttpPost("get-list")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetList([FromBody] CriterionEvaluationGetListRequest request)
        {
            var result = await _service.GetList(request);
            return Ok(new BaseResponse<List<ModelStandardEvaluationGroup>> { Data = result, Success = true });
        }

        [HttpPost("get-submissions")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetSubmissions([FromBody] GetByIdRequest request)
        {
            var result = await _service.GetSubmissions(request.Id!.Value);
            return Ok(new BaseResponse<List<ModelEvaluationSubmission>> { Data = result, Success = true });
        }

        [HttpPost("get-my-submission")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetMySubmission([FromBody] GetByIdRequest request)
        {
            var result = await _service.GetMySubmission(request.Id!.Value);
            return Ok(new BaseResponse<EvaluationSubmissionRequest?> { Data = result, Success = true });
        }

        [HttpPost("submit")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Submit([FromBody] EvaluationSubmissionRequest request)
        {
            await _service.Submit(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut("approve")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Approve([FromBody] ApproveEvaluationRequest request)
        {
            await _service.Approve(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost("initialize")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Initialize([FromBody] InitializeCycleEvaluationRequest request)
        {
            await _service.InitializeForCycle(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost("get-evidences")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetEvidences([FromBody] GetCriterionEvidencesRequest request)
        {
            var result = await _service.GetEvidencesForCriterion(request.Id, request.CycleId);
            return Ok(new BaseResponse<List<ModelCriterionEvidence>> { Data = result, Success = true });
        }
    }
}
