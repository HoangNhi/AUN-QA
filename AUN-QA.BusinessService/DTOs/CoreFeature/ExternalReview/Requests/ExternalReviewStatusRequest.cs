using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewStatusRequest
    {
        public Guid Id { get; set; }
        public int Status { get; set; }
    }

    public class ExternalReviewStatusRequestValidator : AbstractValidator<ExternalReviewStatusRequest>
    {
        public ExternalReviewStatusRequestValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.Status).InclusiveBetween(0, 1);
        }
    }
}
