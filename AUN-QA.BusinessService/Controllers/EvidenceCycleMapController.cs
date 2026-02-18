using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests;
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
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelEvidenceCycleMapGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetById(request);
            return Ok(new BaseResponse<EvidenceCycleMapRequest> { Data = result, Success = true });
        }

        [HttpPost("insert-with-evidence")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> InsertWithEvidence([FromBody] EvidenceCycleMapRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.InsertWithEvidence(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> Update(EvidenceCycleMapRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.Update(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpDelete, Route("delete-list")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> DeleteList([FromBody] DeleteListRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

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
    }
}
