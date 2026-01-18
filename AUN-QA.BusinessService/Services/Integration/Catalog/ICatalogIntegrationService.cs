using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.CatalogService.Protos;

namespace AUN_QA.BusinessService.Services.Integration.Catalog
{
    public interface ICatalogIntegrationService
    {
        #region Stakeholder
        IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(GetStakeholdersStreamRequest request, CancellationToken cancellationToken = default);
        #endregion

        #region Cycle
        IAsyncEnumerable<CycleDto> GetCyclesStreamAsync(GetCyclesStreamRequest request, CancellationToken cancellationToken = default);
        Task<int> GetUserRoleAsync(string cycleId, string userId, CancellationToken cancellationToken = default);
        Task<bool> IsUserInRoleAsync(string cycleId, string userId, int role, CancellationToken cancellationToken = default);
        #endregion
    }
}
