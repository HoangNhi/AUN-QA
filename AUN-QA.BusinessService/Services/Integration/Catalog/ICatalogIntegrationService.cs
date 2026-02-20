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
        Task<bool> CanUserDoActionInPdcaAsync(string cycleId, string userId, string? standardId = null, List<int>? allowedRoles = null, CancellationToken cancellationToken = default);
        #endregion

        #region Standard
        IAsyncEnumerable<CriterionDto> GetCriterionsForEvidenceStreamAsync(GetCriterionsForEvidenceStreamRequest request, CancellationToken cancellationToken = default);
        #endregion

        #region FileType
        IAsyncEnumerable<FileTypeInfo> GetFileTypesStreamAsync(GetFileTypesStreamRequest request, CancellationToken cancellationToken = default);
        #endregion
    }
}
