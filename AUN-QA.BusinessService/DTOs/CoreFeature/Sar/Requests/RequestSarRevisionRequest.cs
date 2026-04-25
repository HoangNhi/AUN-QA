using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class RequestSarRevisionRequest
    {
        public Guid CycleId { get; set; }

        public string RevisionReason { get; set; } = null!;
    }

    public class RequestSarRevisionRequestValidator : AbstractValidator<RequestSarRevisionRequest>
    {
        public RequestSarRevisionRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("CycleId is required");

            RuleFor(x => x.RevisionReason)
                .NotEmpty().WithMessage("RevisionReason is required");
        }
    }
}
