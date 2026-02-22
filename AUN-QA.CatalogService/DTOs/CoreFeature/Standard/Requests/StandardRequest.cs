using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests
{
    public class StandardRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid StandardSetId { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int Order { get; set; }

        public List<CriterionRequest> Criterions { get; set; } = new();
    }

    public class StandardRequestValidator : AbstractValidator<StandardRequest>
    {
        public StandardRequestValidator()
        {
            RuleFor(x => x.StandardSetId)
                .NotEmpty().WithMessage("BÃ¡Â»â„¢ tiÃƒÂªu chuÃ¡ÂºÂ©n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("MÃƒÂ£ tiÃƒÂªu chuÃ¡ÂºÂ©n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("TÃƒÂªn tiÃƒÂªu chuÃ¡ÂºÂ©n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.Order)
                .GreaterThanOrEqualTo(0).WithMessage("ThÃ¡Â»Â© tÃ¡Â»Â± phÃ¡ÂºÂ£i lÃ¡Â»â€ºn hÃ†Â¡n hoÃ¡ÂºÂ·c bÃ¡ÂºÂ±ng 0");

            RuleForEach(x => x.Criterions).SetValidator(new CriterionRequestValidator());
        }
    }
}
