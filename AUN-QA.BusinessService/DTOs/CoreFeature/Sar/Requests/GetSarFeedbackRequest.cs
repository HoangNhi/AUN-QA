using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class GetSarFeedbackRequest
    {
        public Guid CycleId { get; set; }

        public string? CriterionCode { get; set; }

        public int? CommentType { get; set; }
    }

    public class GetSarFeedbackRequestValidator : AbstractValidator<GetSarFeedbackRequest>
    {
        public GetSarFeedbackRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("CycleId is required");
        }
    }
}
