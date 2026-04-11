using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests
{
    public class AddInternalCommentRequest
    {
        public Guid CycleId { get; set; }

        public string CommentText { get; set; } = string.Empty;

        public string? HighlightedText { get; set; }

        public string? CommentMarkId { get; set; }

        public int? OccurrenceIndex { get; set; }
    }

    public class AddInternalCommentRequestValidator : AbstractValidator<AddInternalCommentRequest>
    {
        public AddInternalCommentRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty()
                .WithMessage("CycleId is required");

            RuleFor(x => x.CommentText)
                .MaximumLength(2000)
                .WithMessage("CommentText must be 2000 characters or fewer");
        }
    }
}
