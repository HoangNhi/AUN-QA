using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewRequest
    {
        public Guid CycleId { get; set; }
    }

    public class ExternalReviewRequestValidator : AbstractValidator<ExternalReviewRequest>
    {
        public ExternalReviewRequestValidator()
        {
            RuleFor(x => x.CycleId).NotEmpty();
        }
    }
}
