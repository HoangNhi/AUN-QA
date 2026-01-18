using AUN_QA.BusinessService.DTOs.Integration.Catalog;

namespace AUN_QA.BusinessService.Services.Integration.Catalog
{
    public interface ICatalogIntegrationService
    {
        #region Stakeholder
        IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(int? type, CancellationToken cancellationToken = default);
        #endregion

        #region Cycle
        Task<int> GetUserRoleAsync(string cycleId, string userId, CancellationToken cancellationToken = default);
        Task<bool> IsUserInRoleAsync(string cycleId, string userId, int role, CancellationToken cancellationToken = default);
        #endregion
    }
}
