using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class SubmitSarRequest
    {
        public Guid CycleId { get; set; }
    }

    public class SubmitSarRequestValidator : AbstractValidator<SubmitSarRequest>
    {
        public SubmitSarRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("CycleId is required");
        }
    }
}
