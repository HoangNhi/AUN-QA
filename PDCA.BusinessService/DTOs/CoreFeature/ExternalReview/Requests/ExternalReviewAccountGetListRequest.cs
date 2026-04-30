using AUN_QA.Shared.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewAccountGetListRequest : GetListPagingRequest
    {
        public Guid ExternalReviewId { get; set; }
    }

    public class ExternalReviewAccountGetListRequestValidator
        : AbstractValidator<ExternalReviewAccountGetListRequest>
    {
        public ExternalReviewAccountGetListRequestValidator()
        {
            RuleFor(x => x.ExternalReviewId).NotEmpty();
            RuleFor(x => x.PageIndex).GreaterThan(0);
            RuleFor(x => x.PageSize).GreaterThan(0);
        }
    }
}
