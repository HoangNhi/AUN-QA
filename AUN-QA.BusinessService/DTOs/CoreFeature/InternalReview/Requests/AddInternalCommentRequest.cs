using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests
{
    public class AddInternalCommentRequest
    {
        public Guid CycleId { get; set; }

        public string CommentText { get; set; } = string.Empty;

        public string? HighlightedText { get; set; }

        public string? CommentMarkId { get; set; }
    }

    public class AddInternalCommentRequestValidator : AbstractValidator<AddInternalCommentRequest>
    {
        public AddInternalCommentRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty()
                .WithMessage("CycleId is required");

            RuleFor(x => x.CommentText)
                .NotEmpty()
                .WithMessage("CommentText is required");
        }
    }
}
