using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests
{
    public class EvidenceSubmitToApproveRequest
    {
        public List<Guid> Ids { get; set; }
    }

    public class EvidenceSubmitToApproveRequestValidator : AbstractValidator<EvidenceSubmitToApproveRequest>
    {
        public EvidenceSubmitToApproveRequestValidator()
        {
            RuleFor(x => x.Ids).NotEmpty().WithMessage("Danh sách minh chứng là bắt buộc");
        }
    }
}
