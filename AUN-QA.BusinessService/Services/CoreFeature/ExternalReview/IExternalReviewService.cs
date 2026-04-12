using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.ExternalReview
{
    public interface IExternalReviewService
    {
        Task<ModelExternalReview> CreateAsync(ExternalReviewRequest request);
        Task<ModelExternalReview?> GetByCycleIdAsync(Guid cycleId);
        Task UpdateStatusAsync(ExternalReviewStatusRequest request);
        Task UpdateWatermarkAsync(ExternalReviewWatermarkRequest request);
        Task ConfirmCompletionAsync(Guid id);
        Task<ModelExternalReviewResult> UpsertResultAsync(ExternalReviewResultRequest request);
        Task<ModelExternalReviewFinding> AddFindingAsync(ExternalReviewFindingRequest request);
        Task UpdateFindingAsync(ExternalReviewFindingUpdateRequest request);
        Task DeleteFindingAsync(Guid findingId);
        Task<List<ModelExtAccount>> GetAccountsAsync(Guid externalReviewId);
        Task<ModelExtAccount> AddAccountAsync(Guid externalReviewId, Guid userId);
        Task RemoveAccountAsync(Guid accountId);
    }
}
