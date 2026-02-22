using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.CriterionRequirement.Requests;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests
{
    public class CriterionRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid StandardId { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public bool IsPrerequisite { get; set; } = true;

        public string? DiagnosticQuestions { get; set; }

        public string? Description { get; set; }

        public int Order { get; set; }

        #region GetList
        public string? FileType { get; set; }
        #endregion

        public List<CriterionRequirementRequest> CriterionRequirements { get; set; } = new();
    }

    public class CriterionRequestValidator : AbstractValidator<CriterionRequest>
    {
        public CriterionRequestValidator()
        {
            RuleFor(x => x.StandardId)
                .NotEmpty().WithMessage("TiÃƒÂªu chuÃ¡ÂºÂ©n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("MÃƒÂ£ tiÃƒÂªu chÃƒÂ­ khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("TÃƒÂªn tiÃƒÂªu chÃƒÂ­ khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.IsPrerequisite)
                .NotNull().WithMessage("BÃ¡ÂºÂ¯t buÃ¡Â»â„¢c phÃ¡ÂºÂ£i chÃ¡Â»Ân tiÃƒÂªn quyÃ¡ÂºÂ¿t hoÃ¡ÂºÂ·c khÃƒÂ´ng tiÃƒÂªn quyÃ¡ÂºÂ¿t");

            RuleFor(x => x.Order)
                .GreaterThanOrEqualTo(0).WithMessage("ThÃ¡Â»Â© tÃ¡Â»Â± phÃ¡ÂºÂ£i lÃ¡Â»â€ºn hÃ†Â¡n hoÃ¡ÂºÂ·c bÃ¡ÂºÂ±ng 0");

            RuleForEach(x => x.CriterionRequirements).SetValidator(new CriterionRequirementRequestValidator());
        }
    }
}
