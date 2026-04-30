using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.Shared.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.Evidence;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvidenceController : BaseController<EvidenceController>
    {
        private readonly IEvidenceService _service;

        public EvidenceController(IEvidenceService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetList(EvidenceGetListPagingRequest request)
        {
            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelEvidenceGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            var result = await _service.GetById(request);
            return Ok(new BaseResponse<ModelEvidence> { Data = result, Success = true });
        }

        [HttpGet, Route("preview/{attachmentId}")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> PreviewAttachment([FromRoute] Guid attachmentId, [FromQuery] string mode = "internal")
        {
            var result = await _service.PreviewAttachment(attachmentId, mode);
            Response.Headers["X-Original-Content-Type"] = result.OriginalContentType ?? string.Empty;
            Response.Headers["X-Converted-Content-Type"] = result.ConvertedContentType ?? string.Empty;
            return File(result.FileContent, result.ContentType, result.FileName);
        }

        [HttpPost("insert")]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> Insert([FromBody] EvidenceRequest request)
        {
            await _service.Insert(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> Update(EvidenceRequest request)
        {
            await _service.Update(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpDelete, Route("delete-list")]
        [AttributePermission(Action = ActionType.DELETE)]
        public async Task<IActionResult> DeleteList([FromBody] DeleteListRequest request)
        {
            await _service.DeleteList(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpGet, Route("get-all-combobox")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetAllForCombobox()
        {
            var result = await _service.GetAllForCombobox();
            return Ok(new BaseResponse<List<ModelCombobox>> { Data = result, Success = true });
        }

        [HttpPost, Route("submit-to-approve")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> SubmitToApprove([FromBody] EvidenceSubmitToApproveRequest request)
        {
            await _service.SubmitForReview(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("approve")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Approve([FromBody] EvidenceApproveRequest request)
        {
            await _service.Approve(request);
            return Ok(new BaseResponse(true, 200));
        }
    }
}
