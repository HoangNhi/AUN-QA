using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class AddSarFeedbackRequest
    {
        public Guid CycleId { get; set; }

        public string? CriterionCode { get; set; }

        public string CommentText { get; set; } = null!;

        public int CommentType { get; set; } = 1;
    }

    public class AddSarFeedbackRequestValidator : AbstractValidator<AddSarFeedbackRequest>
    {
        public AddSarFeedbackRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("CycleId is required");

            RuleFor(x => x.CommentText)
                .NotEmpty().WithMessage("CommentText is required");

            RuleFor(x => x.CommentType)
                .GreaterThan(0).WithMessage("CommentType must be greater than zero");
        }
    }
}
