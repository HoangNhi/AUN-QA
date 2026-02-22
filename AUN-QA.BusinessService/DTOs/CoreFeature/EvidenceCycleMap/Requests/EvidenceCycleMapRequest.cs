using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests
{
    public class EvidenceCycleMapRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid EvidenceId { get; set; }

        public Guid CycleId { get; set; }

        public int ReviewStatus { get; set; } = ((int)EvidenceCycleMapReviewStatus.NotStarted);

        public string? FinalDecisionBy { get; set; }

        public DateTime? FinalDecisionAt { get; set; }
        
        public EvidenceRequest? Evidence { get; set; }
    }

    public class EvidenceCycleMapRequestValidator : AbstractValidator<EvidenceCycleMapRequest>
    {
        public EvidenceCycleMapRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("Chu ká»³ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.EvidenceId)
                .NotEmpty().WithMessage("Báº±ng chá»©ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            
            RuleFor(x => x.Evidence)
                .SetValidator(new EvidenceRequestValidator()!)
                .When(x => x.Evidence != null);
        }
    }
}
