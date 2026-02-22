using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Council.Requests
{
    public class CouncilRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public Guid? UserId { get; set; }

        /// <summary>
        /// 1=Chá»§ tá»‹ch HÄ, 2=PhÃ³ CT HÄ, 3=ThÆ° kÃ½, 4=ThÃ nh viÃªn ÄG, 5=NgÆ°á»i cung cáº¥p MC
        /// </summary>
        public int RoleId { get; set; } = 4;  // default: ThÃ nh viÃªn ÄG
        public List<Guid> AssignedStandardIds { get; set; } = new();
    }

    public class CouncilRequestValidator : AbstractValidator<CouncilRequest>
    {
        public CouncilRequestValidator()
        {
            RuleFor(x => x.CycleId).NotEmpty().WithMessage("Há»™i Ä‘á»“ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.UserId).NotEmpty().WithMessage("ThÃ nh viÃªn há»™i Ä‘á»“ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }
}
