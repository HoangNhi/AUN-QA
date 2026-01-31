using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests
{
    public class StandardRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public List<CriterionRequest> Criterions { get; set; } = new();
    }

    public class StandardRequestValidator : AbstractValidator<StandardRequest>
    {
        public StandardRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã tiêu chuẩn không được để trống");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên tiêu chuẩn không được để trống");

            RuleForEach(x => x.Criterions).SetValidator(new CriterionRequestValidator());
        }
    }
}
