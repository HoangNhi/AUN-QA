using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.Dashboard;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.Dashboard;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : BaseController<DashboardController>
    {
        private readonly IDashboardService _service;

        public DashboardController(IDashboardService service)
        {
            _service = service;
        }

        [HttpGet, Route("cycles-summary")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetCyclesSummary()
        {
            var result = await _service.GetCyclesSummaryAsync();
            return Ok(new BaseResponse<DashboardOverviewDto> { Data = result, Success = true });
        }
    }
}
