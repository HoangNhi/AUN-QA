using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.CatalogService.Protos;

namespace AUN_QA.BusinessService.Services.Integration.Catalog
{
    public interface ICatalogIntegrationService
    {
        #region Stakeholder
        IAsyncEnumerable<StakeholderDto> GetStakeholdersStreamAsync(GetStakeholdersStreamRequest request, CancellationToken cancellationToken = default);
        #endregion

        #region Standard
        IAsyncEnumerable<CriterionDto> GetCriterionsForEvidenceStreamAsync(GetCriterionsForEvidenceStreamRequest request, CancellationToken cancellationToken = default);
        IAsyncEnumerable<StandardWithCriteriaDto> GetStandardsWithCriteriaStreamAsync(GetStandardsWithCriteriaStreamRequest request, CancellationToken cancellationToken = default);
        IAsyncEnumerable<FileTypeInfo> GetFileTypesByCriterionStreamAsync(GetFileTypesByCriterionStreamRequest request, CancellationToken cancellationToken = default);
        #endregion

        #region FileType
        IAsyncEnumerable<FileTypeInfo> GetFileTypesStreamAsync(GetFileTypesStreamRequest request, CancellationToken cancellationToken = default);
        #endregion

        #region StandardSet
        Task<int> GetStandardSetEvaluationModeAsync(string standardSetId);
        #endregion
    }
}
