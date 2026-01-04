using AUN_QA.BusinessService.DTOs.Integration.Catalog;

namespace AUN_QA.BusinessService.Services.Integration.Catalog
{
    public interface ICatalogIntegrationService
    {
        IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(int? type, CancellationToken cancellationToken = default);
    }
}
