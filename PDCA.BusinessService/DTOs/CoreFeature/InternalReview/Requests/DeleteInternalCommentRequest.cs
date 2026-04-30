using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests
{
    public class DeleteInternalCommentRequest
    {
        public Guid CommentId { get; set; }
    }

    public class DeleteInternalCommentRequestValidator : AbstractValidator<DeleteInternalCommentRequest>
    {
        public DeleteInternalCommentRequestValidator()
        {
            RuleFor(x => x.CommentId)
                .NotEmpty()
                .WithMessage("CommentId is required");
        }
    }
}
