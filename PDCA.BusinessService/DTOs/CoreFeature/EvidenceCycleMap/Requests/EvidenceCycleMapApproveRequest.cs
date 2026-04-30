using AUN_QA.BusinessService.DTOs.Common;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests
{
    public class EvidenceCycleMapApproveRequest
    {
        public Guid Id { get; set; }

        public int EvidenceStatus { get; set; }

        public string? RejectionReason { get; set; }
    }

    public class EvidenceCycleMapApproveRequestValidator : AbstractValidator<EvidenceCycleMapApproveRequest>
    {
        public EvidenceCycleMapApproveRequestValidator()
        {
            RuleFor(x => x.Id)
                .NotEmpty().WithMessage("Minh chứng không được để trống");

            RuleFor(x => x.EvidenceStatus)
                .InclusiveBetween(((int)EvidenceStatus.Verified), ((int)EvidenceStatus.Rejected))
                .WithMessage("Trạng thái bằng chứng không hợp lệ");

            When(x => x.EvidenceStatus == (int)EvidenceStatus.Rejected, () =>
            {
                RuleFor(x => x.RejectionReason)
                    .NotEmpty().WithMessage("Lý do từ chối không được để trống");
            });

        }
    }
}
