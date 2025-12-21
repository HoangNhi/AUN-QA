using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Common;
using AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Requests;
using AUN_QA.CatalogService.Helpers;
using AUN_QA.CatalogService.Services.CoreFeature.Faculty;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.CatalogService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FacultyController : BaseController<FacultyController>
    {
        private readonly IFacultyService _service;

        public FacultyController(IFacultyService service)
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
            return Ok(new BaseResponse<GetListPagingResponse<ModelFaculty>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetById(request);
            return Ok(new BaseResponse<ModelFaculty> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> Insert([FromBody] FacultyRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.Insert(request);
            return Ok(new BaseResponse<ModelFaculty> { Data = result, Success = true });
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> Update(FacultyRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.Update(request);
            return Ok(new BaseResponse<ModelFaculty> { Data = result, Success = true });
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

        [HttpGet, Route("get-all-combobox")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetAllForCombobox()
        {
            var result = await _service.GetAllForCombobox();
            return Ok(new BaseResponse<List<ModelCombobox>> { Data = result, Success = true });
        }
    }
}
