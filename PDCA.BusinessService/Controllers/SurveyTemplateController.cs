using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.Shared.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.SurveyTemplate;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SurveyTemplateController : BaseController<SurveyTemplateController>
    {
        private readonly ISurveyTemplateService _service;

        public SurveyTemplateController(ISurveyTemplateService service)
        {
            _service = service;
        }

        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetList(SurveyTemplateGetListPagingRequest request)
        {
            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelSurveyTemplateGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            var result = await _service.GetById(request);
            return Ok(new BaseResponse<ModelSurveyTemplate> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> Insert([FromBody] SurveyTemplateRequest request)
        {
            var result = await _service.Insert(request);
            return Ok(new BaseResponse<ModelSurveyTemplate> { Data = result, Success = true });
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> Update(SurveyTemplateRequest request)
        {
            var result = await _service.Update(request);
            return Ok(new BaseResponse<ModelSurveyTemplate> { Data = result, Success = true });
        }

        [HttpDelete, Route("delete-list")]
        [AttributePermission(Action = ActionType.DELETE)]
        public async Task<IActionResult> DeleteList([FromBody] DeleteListRequest request)
        {
            var result = await _service.DeleteList(request);
            return Ok(new BaseResponse<string> { Data = result, Success = true });
        }

        [HttpGet, Route("get-all-combobox")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetAllForCombobox([FromQuery] SurveyTemplateGetComboboxRequest request)
        {
            var result = await _service.GetAllForCombobox(request);
            return Ok(new BaseResponse<List<ModelCombobox>> { Data = result, Success = true });
        }
    }
}
