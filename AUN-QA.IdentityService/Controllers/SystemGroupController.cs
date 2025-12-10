using AUN_QA.IdentityService.DTOs.Base;
using AUN_QA.IdentityService.DTOs.Common;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Dtos;
using AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Requests;
using AUN_QA.IdentityService.Services.SystemGroup;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.IdentityService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SystemGroupController : BaseController<SystemGroupController>
    {
        private readonly ISystemGroupService _service;

        public SystemGroupController(ISystemGroupService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        public async Task<IActionResult> GetList(GetListPagingRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelSystemGroupGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        public IActionResult GetById([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.GetById(request);
            return Ok(new BaseResponse<ModelSystemGroup> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        public IActionResult Insert([FromBody] SystemGroupRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.Insert(request);
            return Ok(new BaseResponse<ModelSystemGroup> { Data = result, Success = true });
        }

        [HttpPut, Route("update")]
        public IActionResult Update(SystemGroupRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.Update(request);
            return Ok(new BaseResponse<ModelSystemGroup> { Data = result, Success = true });
        }

        [HttpDelete, Route("delete-list")]
        public IActionResult DeleteList([FromBody] DeleteListRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.DeleteList(request);
            return Ok(new BaseResponse<string> { Data = result, Success = true });
        }

        [HttpGet, Route("get-all-combobox")]
        public IActionResult GetAllForCombobox()
        {
            var result = _service.GetAllForCombobox();
            return Ok(new BaseResponse<List<MODELCombobox>> { Data = result, Success = true });
        }
    }
}
