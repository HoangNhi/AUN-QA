using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewAddAccountRequest
    {
        public Guid UserId { get; set; }
    }

    public class ExternalReviewAddAccountRequestValidator : AbstractValidator<ExternalReviewAddAccountRequest>
    {
        public ExternalReviewAddAccountRequestValidator()
        {
            RuleFor(x => x.UserId).NotEmpty();
        }
    }
}
