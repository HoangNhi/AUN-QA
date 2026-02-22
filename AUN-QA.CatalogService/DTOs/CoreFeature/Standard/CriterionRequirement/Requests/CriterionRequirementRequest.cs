using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.CriterionRequirement.Requests
{
    public class CriterionRequirementRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CriterionId { get; set; }

        public Guid FileTypeId { get; set; }

        public bool IsMandatory { get; set; } = true;

        public int MinQuantity { get; set; }

        public string? Suggestion { get; set; }
    }

    public class CriterionRequirementRequestValidator : AbstractValidator<CriterionRequirementRequest>
    {
        public CriterionRequirementRequestValidator()
        {
            RuleFor(x => x.CriterionId).NotEmpty().WithMessage("TiÃªu chÃ­ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.FileTypeId).NotEmpty().WithMessage("Loáº¡i tÃ i liá»‡u khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.IsMandatory).NotNull().WithMessage("Báº¯t buá»™c pháº£i chá»n báº¯t buá»™c hoáº·c khÃ´ng báº¯t buá»™c");
            RuleFor(x => x.MinQuantity).GreaterThanOrEqualTo(0).WithMessage("Sá»‘ lÆ°á»£ng tá»‘i thiá»ƒu pháº£i lá»›n hÆ¡n hoáº·c báº±ng 0");
        }
    }
}
