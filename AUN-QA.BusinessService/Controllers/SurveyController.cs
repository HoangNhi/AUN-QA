using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.Services.CoreFeature.Survey;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SurveyController : BaseController<SurveyController>
    {
        private readonly ISurveyService _surveyService;
        public SurveyController(ISurveyService surveyService)
        {
            _surveyService = surveyService;
        }

        [HttpPost("send-survey")]
        [AllowAnonymous]
        public async Task<ActionResult<string>> SendSurvey([FromQuery] int? type)
        {
            var result = await _surveyService.SendSurvey(type);
            return Ok(result);
        }
    }
}
