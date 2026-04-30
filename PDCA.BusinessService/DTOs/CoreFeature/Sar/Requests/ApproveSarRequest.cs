using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class ApproveSarRequest
    {
        public Guid CycleId { get; set; }
    }

    public class ApproveSarRequestValidator : AbstractValidator<ApproveSarRequest>
    {
        public ApproveSarRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("CycleId is required");
        }
    }
}
