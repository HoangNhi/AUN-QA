using AUN_QA.BusinessService.DTOs.CoreFeature.Dashboard;

namespace AUN_QA.BusinessService.Services.CoreFeature.Dashboard
{
    public interface IDashboardService
    {
        Task<DashboardOverviewDto> GetCyclesSummaryAsync();
    }
}
