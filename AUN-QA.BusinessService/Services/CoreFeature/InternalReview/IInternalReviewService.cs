using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.InternalReview
{
    public interface IInternalReviewService
    {
        Task<List<InternalCommentDto>> GetComments(GetInternalCommentsRequest request);

        Task<InternalCommentDto> AddComment(AddInternalCommentRequest request);

        Task DeleteComment(DeleteInternalCommentRequest request);
    }
}
