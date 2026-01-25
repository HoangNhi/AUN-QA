using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.Survey;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SurveyCampaignController : BaseController<SurveyCampaignController>
    {
        private readonly ISurveyCampaignService _service;
        public SurveyCampaignController(ISurveyCampaignService service)
        {
            _service = service;
        }

        #region SurveyCampaign
        [HttpPost, Route("get-list")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetList(SurveyCampaignGetListPagingRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetList(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelSurveyCampaignGetListPaging>> { Data = result, Success = true });
        }

        [HttpGet, Route("get-by-id")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetById([FromQuery] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetById(request);
            return Ok(new BaseResponse<SurveyCampaignRequest> { Data = result, Success = true });
        }

        [HttpPost("insert")]
        [AttributePermission(Action = ActionType.ADD)]
        public async Task<IActionResult> Insert([FromBody] SurveyCampaignRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.Insert(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPut, Route("update")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> Update(SurveyCampaignRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.Update(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpDelete, Route("delete-list")]
        [AttributePermission(Action = ActionType.DELETE)]
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

        [HttpPost("change-status")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> ChangeStatus([FromBody] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.ChangeStatus(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpGet("get-survey-by-token")]
        [AllowAnonymous]
        public async Task<IActionResult> GetSurveyByToken([FromQuery] GetSurveyByTokenRequest request)
        {
            var result = await _service.GetSurveyByToken(request);
            return Ok(new BaseResponse<ModelDoSurvey> { Data = result, Success = true });
        }

        [HttpPost("submit-survey")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitSurvey([FromBody] SurveySubmissionRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.SubmitSurvey(request);
            return Ok(new BaseResponse(true, 200));
        }
        #endregion

        #region Session
        [HttpPost, Route("get-stakeholder-not-in-campaign")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetStakeholdersNotInCampaign(GetStakeholdersNotInCampaignRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetStakeholdersNotInCampaign(request);
            return Ok(new BaseResponse<GetListPagingResponse<StakeholderDto>> { Data = result, Success = true });
        }

        [HttpPost, Route("get-list-session")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> GetListSession(SurveySessionGetListPagingRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            var result = await _service.GetListSession(request);
            return Ok(new BaseResponse<GetListPagingResponse<ModelSurveySession>> { Data = result, Success = true });
        }

        [HttpPost, Route("add-list-stakeholder-to-campaign")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> AddListStakeholderToCampaign(AddListStakeholderToCampaignRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.AddListStakeholderToCampaign(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost, Route("add-all-stakeholder-to-campaign")]
        [AttributePermission(Action = ActionType.VIEW)]
        public async Task<IActionResult> AddAllStakeholderToCampaign(AddAllStakeholderToCampaignRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.AddAllStakeholderToCampaign(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpDelete, Route("delete-list-session")]
        [AttributePermission(Action = ActionType.DELETE)]
        public async Task<IActionResult> DeleteListSession([FromBody] DeleteListRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.DeleteListSession(request);
            return Ok(new BaseResponse(true, 200));
        }

        [HttpPost("send-survey-invitation")]
        [AttributePermission(Action = ActionType.UPDATE)]
        public async Task<IActionResult> SendSurveyInvitation([FromBody] GetByIdRequest request)
        {
            if (!ModelState.IsValid)
                return Ok(new BaseResponse(false, 400, CommonFunc.GetModelStateAPI(ModelState)));

            await _service.SendSurveyInvitation(request);
            return Ok(new BaseResponse(true, 200));
        }
        #endregion
    }
}
