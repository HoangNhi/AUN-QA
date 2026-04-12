using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.ExternalReview;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route(BaseRoute)]
    [ApiController]
    public class ExternalReviewController : BaseController<ExternalReviewController>
    {
        private const string BaseRoute = "api/external-review";
        private const string ByCycleRoute = "by-cycle";
        private const string StatusRoute = "status";
        private const string WatermarkRoute = "watermark";
        private const string ConfirmCompletionRoute = "{id:guid}/confirm-completion";
        private const string ResultsRoute = "results";
        private const string FindingsRoute = "findings";
        private const string FindingByIdRoute = "findings/{id:guid}";
        private const string AccountsByExternalReviewRoute = "{id:guid}/accounts";
        private const string AccountByIdRoute = "accounts/{accountId:guid}";

        private readonly IExternalReviewService _service;

        public ExternalReviewController(IExternalReviewService service)
        {
            _service = service;
        }

        [HttpGet]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetList([FromQuery] ExternalReviewGetListPagingRequest request)
        {
            var result = await _service.GetListAsync(request);
            return Ok(new BaseResponse<GetListPagingResponse<ExternalReviewListItemDto>>
            {
                Data = result,
                Success = true
            });
        }

        [HttpPost]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> Create([FromBody] ExternalReviewRequest request)
        {
            var result = await _service.CreateAsync(request);
            return Ok(new BaseResponse<ModelExternalReview> { Data = result, Success = true });
        }

        [HttpGet(ByCycleRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetByCycle([FromQuery] Guid cycleId)
        {
            var result = await _service.GetByCycleIdAsync(cycleId);
            return Ok(new BaseResponse<ModelExternalReview?> { Data = result, Success = true });
        }

        [HttpPut(StatusRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> UpdateStatus([FromBody] ExternalReviewStatusRequest request)
        {
            await _service.UpdateStatusAsync(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut(WatermarkRoute)]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> UpdateWatermark([FromBody] ExternalReviewWatermarkRequest request)
        {
            await _service.UpdateWatermarkAsync(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost(ConfirmCompletionRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> ConfirmCompletion(Guid id)
        {
            await _service.ConfirmCompletionAsync(id);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost(ResultsRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> UpsertResult([FromBody] ExternalReviewResultRequest request)
        {
            var result = await _service.UpsertResultAsync(request);
            return Ok(new BaseResponse<ModelExternalReviewResult> { Data = result, Success = true });
        }

        [HttpPost(FindingsRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> AddFinding([FromBody] ExternalReviewFindingRequest request)
        {
            var result = await _service.AddFindingAsync(request);
            return Ok(new BaseResponse<ModelExternalReviewFinding> { Data = result, Success = true });
        }

        [HttpPut(FindingsRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> UpdateFinding([FromBody] ExternalReviewFindingUpdateRequest request)
        {
            await _service.UpdateFindingAsync(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpDelete(FindingByIdRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> DeleteFinding(Guid id)
        {
            await _service.DeleteFindingAsync(id);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpGet(AccountsByExternalReviewRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetAccounts(Guid id)
        {
            var result = await _service.GetAccountsAsync(id);
            return Ok(new BaseResponse<List<ModelExtAccount>> { Data = result, Success = true });
        }

        [HttpPost(AccountsByExternalReviewRoute)]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> AddAccount(Guid id, [FromBody] ExternalReviewAddAccountRequest request)
        {
            var result = await _service.AddAccountAsync(id, request.UserId);
            return Ok(new BaseResponse<ModelExtAccount> { Data = result, Success = true });
        }

        [HttpDelete(AccountByIdRoute)]
        [AttributePermission(Action = ActionType.DELETE)]
        public async Task<IActionResult> RemoveAccount(Guid accountId)
        {
            await _service.RemoveAccountAsync(accountId);
            return Ok(new BaseResponse(true, 200));
        }
    }
}
