using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Services.CoreFeature.ExternalReview
{
    public interface IExternalReviewService
    {
        Task<ModelExternalReview> CreateAsync(ExternalReviewRequest request);
        Task<GetListPagingResponse<ExternalReviewListItemDto>> GetListAsync(ExternalReviewGetListPagingRequest request);
        Task<ModelExternalReview?> GetByCycleIdAsync(Guid cycleId);
        Task UpdateStatusAsync(ExternalReviewStatusRequest request);
        Task UpdateWatermarkAsync(ExternalReviewWatermarkRequest request);
        Task ConfirmCompletionAsync(Guid id);
        Task<ModelExternalReviewResult> UpsertResultAsync(ExternalReviewResultRequest request);
        Task<ModelExternalReviewFinding> AddFindingAsync(ExternalReviewFindingRequest request);
        Task UpdateFindingAsync(ExternalReviewFindingUpdateRequest request);
        Task DeleteFindingAsync(Guid findingId);
        Task<List<ModelExtAccount>> GetAccountsAsync(Guid externalReviewId);
        Task<GetListPagingResponse<ModelExtAccount>> GetAccountsListAsync(ExternalReviewAccountGetListRequest request);
        Task<ModelExtAccount> AddAccountAsync(Guid externalReviewId, Guid userId);
        Task<ModelExtAccount> CreateAndLinkAccountAsync(Guid externalReviewId, ExternalReviewCreateAccountRequest request);
        Task RemoveAccountAsync(Guid accountId);
        Task<ModelExtAccount> UpdateAccountAsync(ExternalReviewAccountUpdateRequest request);
    }
}
