using AUN_QA.BusinessService.DTOs.Common;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests
{
    public class EvidenceApproveRequest
    {
        public Guid Id { get; set; }

        public int EvidenceStatus { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class EvidenceApproveRequestValidator : AbstractValidator<EvidenceApproveRequest>
    {
        public EvidenceApproveRequestValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Minh chứng không được để trống");

            RuleFor(x => x.EvidenceStatus)
                .InclusiveBetween((int)EvidenceStatus.Verified, (int)EvidenceStatus.Rejected)
                .WithMessage("Trạng thái không hợp lệ");

            When(x => x.EvidenceStatus == (int)EvidenceStatus.Rejected, () =>
            {
                RuleFor(x => x.RejectionReason)
                    .NotEmpty().WithMessage("Lý do từ chối không được để trống");
            });
        }
    }
}
