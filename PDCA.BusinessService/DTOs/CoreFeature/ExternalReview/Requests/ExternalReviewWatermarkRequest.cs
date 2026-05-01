using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewWatermarkRequest
    {
        public Guid Id { get; set; }
        public string WatermarkText { get; set; } = string.Empty;
        public int WatermarkOpacity { get; set; }
        public int WatermarkPosition { get; set; }
    }

    public class ExternalReviewWatermarkRequestValidator : AbstractValidator<ExternalReviewWatermarkRequest>
    {
        public ExternalReviewWatermarkRequestValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.WatermarkText).NotEmpty().MaximumLength(500);
            RuleFor(x => x.WatermarkOpacity).InclusiveBetween(0, 100);
            RuleFor(x => x.WatermarkPosition).InclusiveBetween(0, 2);
        }
    }
}
