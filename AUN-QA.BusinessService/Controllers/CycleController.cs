using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.Shared.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CycleController : BaseController<CycleController>
    {
        private const string GetComboboxForExternalReviewRoute = "get-combobox-for-external-review";
        private readonly ICycleService _service;

        public CycleController(ICycleService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetList(CycleGetListPagingRequest request)
        {
            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelCycleGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            var result = await _service.GetById(request);
            return Ok(new BaseResponse<ModelCycle> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> Insert([FromBody] CycleRequest request)
        {
            await _service.Insert(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> Update(CycleRequest request)
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

        [HttpGet, Route("get-combobox-by-user")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetAllForCombobox()
        {
            var result = await _service.GetComboboxByUser();
            return Ok(new BaseResponse<List<ModelCombobox>> { Data = result, Success = true });
        }

        [HttpGet, Route(GetComboboxForExternalReviewRoute)]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetComboboxForExternalReview()
        {
            var result = await _service.GetComboboxForExternalReview();
            return Ok(new BaseResponse<List<ModelCombobox>> { Data = result, Success = true });
        }

        [HttpPut("change-status")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> ChangeStatus([FromBody] CycleChangeStatusRequest request)
        {
            await _service.ChangeStatusAsync(request);
            return Ok(new BaseResponse(true, 200));
        }
    }
}
