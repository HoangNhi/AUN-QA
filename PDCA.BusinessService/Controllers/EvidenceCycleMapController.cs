using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.Shared.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Responses;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.EvidenceCycleMap;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EvidenceCycleMapController : BaseController<EvidenceCycleMapController>
    {
        private readonly IEvidenceCycleMapService _service;

        public EvidenceCycleMapController(IEvidenceCycleMapService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetList(EvidenceCycleMapGetListPagingRequest request)
        {
            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            var result = await _service.GetById(request);
            return Ok(new BaseResponse<EvidenceCycleMapRequest> { Data = result, Success = true });
        }

        [HttpPost("insert-with-evidence")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> InsertWithEvidence([FromBody] EvidenceCycleMapRequest request)
        {
            await _service.InsertWithEvidence(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Update(EvidenceCycleMapRequest request)
        {
            await _service.Update(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpDelete, Route("delete-list")]
        [AttributePermission(Action = ActionType.NONE)]
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
            await _service.SubmitToApprove(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("approve")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Approve(EvidenceCycleMapApproveRequest request)
        {
            await _service.Approve(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpGet, Route("get-verified-filetype-counts")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetVerifiedFileTypeCounts([FromQuery] Guid cycleId)
        {
            if (cycleId == Guid.Empty)
                return Ok(new BaseResponse(false, 400, "cycleId không được để trống"));

            var result = await _service.GetVerifiedFileTypeCountsAsync(cycleId);
            return Ok(new BaseResponse<List<VerifiedFileTypeCountResponse>> { Data = result, Success = true });
        }

        [HttpPost, Route("get-verified-for-reuse")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetVerifiedForReuse([FromBody] VerifiedEvidenceForReuseRequest request)
        {
            var result = await _service.GetVerifiedForReuseAsync(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelVerifiedEvidenceForReuse>> { Data = result, Success = true });
        }

        [HttpPost, Route("reuse-verified-evidence")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> ReuseVerifiedEvidence([FromBody] ReuseVerifiedEvidenceRequest request)
        {
            await _service.ReuseVerifiedEvidenceAsync(request);
            return Ok(new BaseResponse(true, 200));
        }
    }
}
