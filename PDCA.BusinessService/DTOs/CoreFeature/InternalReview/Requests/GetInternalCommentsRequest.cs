using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests
{
    public class GetInternalCommentsRequest
    {
        public Guid CycleId { get; set; }

        public int? ReviewRound { get; set; }
    }

    public class GetInternalCommentsRequestValidator : AbstractValidator<GetInternalCommentsRequest>
    {
        public GetInternalCommentsRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty()
                .WithMessage("CycleId is required");

            RuleFor(x => x.ReviewRound)
                .GreaterThan(0)
                .When(x => x.ReviewRound.HasValue)
                .WithMessage("ReviewRound must be greater than 0");
        }
    }
}
