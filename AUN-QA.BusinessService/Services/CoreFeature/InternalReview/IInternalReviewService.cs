using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests;
using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.Services.CoreFeature.InternalReview
{
    public interface IInternalReviewService
    {
        Task<GetListPagingResponse<SarGetListItemDto>> GetList(SarGetListPagingRequest request);

        Task<List<InternalCommentDto>> GetComments(GetInternalCommentsRequest request);

        Task<InternalCommentDto> AddComment(AddInternalCommentRequest request);

        Task DeleteComment(DeleteInternalCommentRequest request);
    }
}
