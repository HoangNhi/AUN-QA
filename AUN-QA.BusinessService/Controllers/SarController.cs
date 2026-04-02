using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SarController : BaseController<SarController>
    {
        private readonly ISarService _service;

        public SarController(ISarService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetList([FromBody] SarGetListPagingRequest request)
        {
            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<SarGetListItemDto>>
            {
                Data = result,
                Success = true
            });
        }

        [HttpPost, Route("get-by-cycle")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetByCycle([FromBody] GetSarByCycleRequest request)
        {
            var result = await _service.GetByCycle(request);
            return Ok(new BaseResponse<SarDraftDto?>
            {
                Data = result,
                Success = true
            });
        }

        [HttpPost, Route("save-draft")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> SaveDraft([FromBody] SaveSarDraftRequest request)
        {
            await _service.SaveDraft(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("submit")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Submit([FromBody] SubmitSarRequest request)
        {
            await _service.Submit(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("request-revision")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> RequestRevision([FromBody] RequestSarRevisionRequest request)
        {
            await _service.RequestRevision(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("approve")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Approve([FromBody] ApproveSarRequest request)
        {
            await _service.Approve(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("get-feedbacks")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetFeedbacks([FromBody] GetSarFeedbackRequest request)
        {
            var result = await _service.GetFeedbacks(request);
            return Ok(new BaseResponse<List<SarFeedbackDto>> { Data = result, Success = true });
        }

        [HttpPost, Route("add-feedback")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> AddFeedback([FromBody] AddSarFeedbackRequest request)
        {
            await _service.AddFeedback(request);
            return Ok(new BaseResponse(true, 200));
        }
    }
}
