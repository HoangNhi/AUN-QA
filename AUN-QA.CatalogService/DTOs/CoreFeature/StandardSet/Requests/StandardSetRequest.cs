using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Common;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Requests
{
    public class StandardSetRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;

        /// <summary>
        /// 1. SCORING_7: ÃƒÂp dÃ¡Â»Â¥ng cho AUN-QA
        /// 2. PASS_FAIL: ÃƒÂp dÃ¡Â»Â¥ng cho MOET
        /// </summary>
        public int EvaluationMode { get; set; } = ((int)StandardSet_EvaluationMode.SCORING_7);
    }

    public class StandardSetRequestValidator : AbstractValidator<StandardSetRequest>
    {
        public StandardSetRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("MÃƒÂ£ bÃ¡Â»â„¢ tiÃƒÂªu chuÃ¡ÂºÂ©n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("TÃƒÂªn bÃ¡Â»â„¢ tiÃƒÂªu chuÃ¡ÂºÂ©n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");

            RuleFor(x => x.EvaluationMode)
                .NotEmpty().WithMessage("ChÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ Ã„â€˜ÃƒÂ¡nh giÃƒÂ¡ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡");
        }
    }
}
