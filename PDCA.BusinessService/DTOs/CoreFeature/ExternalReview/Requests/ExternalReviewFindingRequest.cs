using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewFindingRequest
    {
        public Guid ExternalReviewResultId { get; set; }
        public int FindingType { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid? CriterionId { get; set; }
    }

    public class ExternalReviewFindingUpdateRequest
    {
        public Guid Id { get; set; }
        public int FindingType { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid? CriterionId { get; set; }
    }

    public class ExternalReviewFindingRequestValidator : AbstractValidator<ExternalReviewFindingRequest>
    {
        public ExternalReviewFindingRequestValidator()
        {
            RuleFor(x => x.ExternalReviewResultId).NotEmpty();
            RuleFor(x => x.FindingType).InclusiveBetween(0, 1);
            RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
        }
    }

    public class ExternalReviewFindingUpdateRequestValidator : AbstractValidator<ExternalReviewFindingUpdateRequest>
    {
        public ExternalReviewFindingUpdateRequestValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.FindingType).InclusiveBetween(0, 1);
            RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
        }
    }
}
