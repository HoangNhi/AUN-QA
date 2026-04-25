using AUN_QA.Shared.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewGetListPagingRequest : GetListPagingRequest
    {
        public int? Status { get; set; }

        public Guid? CycleId { get; set; }
    }

    public class ExternalReviewGetListPagingRequestValidator
        : AbstractValidator<ExternalReviewGetListPagingRequest>
    {
        public ExternalReviewGetListPagingRequestValidator()
        {
            RuleFor(x => x.PageIndex).GreaterThan(0);
            RuleFor(x => x.PageSize).GreaterThan(0);
            RuleFor(x => x.Status)
                .InclusiveBetween(0, 2)
                .When(x => x.Status.HasValue);
        }
    }
}
