using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewResultRequest
    {
        public Guid ExternalReviewId { get; set; }
        public Guid StandardId { get; set; }
        public string? Strengths { get; set; }
    }

    public class ExternalReviewResultRequestValidator : AbstractValidator<ExternalReviewResultRequest>
    {
        public ExternalReviewResultRequestValidator()
        {
            RuleFor(x => x.ExternalReviewId).NotEmpty();
            RuleFor(x => x.StandardId).NotEmpty();
        }
    }
}
