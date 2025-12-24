using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests
{
    public class EvidenceRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;
    }

    public class EvidenceRequestValidator : AbstractValidator<EvidenceRequest>
    {
        public EvidenceRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên không được để trống");
        }
    }
}
