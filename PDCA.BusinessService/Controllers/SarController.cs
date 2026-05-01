using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SarController : BaseController<SarController>
    {
        private readonly ISarService _service;
        private readonly IConfiguration _configuration;

        public SarController(ISarService service, IConfiguration configuration)
        {
            _service = service;
            _configuration = configuration;
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

        [HttpPost, Route("get-autofill-payload")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetAutofillPayload([FromBody] GetSarAutofillPayloadRequest request)
        {
            var result = await _service.GetAutofillPayload(request);
            return Ok(new BaseResponse<SarAutofillPayloadDto> { Data = result, Success = true });
        }

        [HttpPost, Route("export-docx")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> ExportDocx([FromBody] ExportSarDocxRequest request)
        {
            var docxBytes = await _service.ExportDocx(request);
            return File(docxBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "SAR_Export.docx");
        }

        [HttpPost, Route("get-draft-metadata")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetDraftMetadata([FromBody] GetSarDraftMetadataRequest request)
        {
            var result = await _service.GetDraftMetadata(request);
            return Ok(new BaseResponse<SarDraftMetadataDto?>
            {
                Data = result,
                Success = true
            });
        }

        [HttpPost, Route("internal/persist-snapshot")]
        [AllowAnonymous]
        public async Task<IActionResult> PersistSnapshotFromCollab([FromBody] PersistSarSnapshotFromCollabRequest request)
        {
            var expectedSecret = _configuration["Collab:PersistSecret"];
            var actualSecret = Request.Headers["x-collab-secret"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(expectedSecret) || !string.Equals(expectedSecret, actualSecret, StringComparison.Ordinal))
            {
                return Ok(new BaseResponse(false, 403, "Collab secret is invalid"));
            }

            await _service.PersistSnapshotFromCollab(request);
            return Ok(new BaseResponse(true, 200));
        }
    }
}

