using AUN_QA.SystemService.DTOs.Base;
using AUN_QA.SystemService.DTOs.Common;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.User.Requests;
using AUN_QA.SystemService.Helpers;
using AUN_QA.SystemService.Services.User;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.SystemService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseController<UserController>
    {
        private readonly IUserService _service;

        public UserController(IUserService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetList(GetListPagingRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelUser>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.VIEW)]

        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetById(request);
            return Ok(new BaseResponse<ModelUser> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        [AttributePermission(Action = ActionType.ADD)]

        public async Task<IActionResult> Insert([FromBody] UserRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.Insert(request);
            return Ok(new BaseResponse<ModelUser> { Data = result, Success = true });
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.UPDATE)]

        public async Task<IActionResult> Update(UserRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.Update(request);
            return Ok(new BaseResponse<ModelUser> { Data = result, Success = true });
        }

        [HttpDelete, Route("delete-list")]
        [AttributePermission(Action = ActionType.DELETE)]

        public async Task<IActionResult> DeleteList([FromBody] DeleteListRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.DeleteList(request);
            return Ok(new BaseResponse<string> { Data = result, Success = true });
        }

        [HttpGet, Route("get-current-user")]
        [AttributePermission(Action = ActionType.NONE)]

        public async Task<IActionResult> GetCurrentUser()
        {
            var result = await _service.GetCurrentUser();
            return Ok(new BaseResponse<ModelUser> { Data = result, Success = true });
        }
    }
}
