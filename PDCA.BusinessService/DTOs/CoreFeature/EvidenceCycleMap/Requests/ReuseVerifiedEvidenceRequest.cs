using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests
{
    public class ReuseVerifiedEvidenceRequest
    {
        public Guid EvidenceId { get; set; }
        public Guid TargetCycleId { get; set; }
    }

    public class ReuseVerifiedEvidenceRequestValidator : AbstractValidator<ReuseVerifiedEvidenceRequest>
    {
        public ReuseVerifiedEvidenceRequestValidator()
        {
            RuleFor(x => x.EvidenceId).NotEmpty().WithMessage("Minh chứng không được để trống");
            RuleFor(x => x.TargetCycleId).NotEmpty().WithMessage("Chu kỳ không được để trống");
        }
    }
}
