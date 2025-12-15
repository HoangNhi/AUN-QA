using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.Common;
using AUN_QA.SystemService.DTOs.CoreFeature.Permission.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Permission.Requests;
using AUN_QA.SystemService.DTOs.CoreFeature.Role.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Role.Requests;
using AUN_QA.SystemService.Services.Role;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.SystemService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : BaseController<RoleController>
    {
        private readonly IRoleService _service;

        public RoleController(IRoleService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        public async Task<IActionResult> GetList(GetListPagingRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelRoleGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        public IActionResult GetById([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.GetById(request);
            return Ok(new BaseResponse<ModelRole> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        public IActionResult Insert([FromBody] RoleRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.Insert(request);
            return Ok(new BaseResponse<ModelRole> { Data = result, Success = true });
        }

        [HttpPut, Route("update")]
        public IActionResult Update(RoleRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.Update(request);
            return Ok(new BaseResponse<ModelRole> { Data = result, Success = true });
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
            return Ok(new BaseResponse<List<ModelCombobox>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-permissions-by-role")]
        public async Task<IActionResult> GetPermissionsByRole([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetPermissionsByRole(request);
            return Ok(new BaseResponse<List<ModelPermission>> { Data = result, Success = true });
        }

        [HttpPut, Route("update-permissions")]
        public IActionResult UpdatePermissions(UpdatePermissionsRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = _service.UpdatePermissions(request);
            return Ok(new BaseResponse<bool> { Success = true });
        }
    }
}
