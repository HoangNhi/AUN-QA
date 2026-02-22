using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests
{
    public class TemplateQuestionRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CategoryId { get; set; }

        public string Content { get; set; } = null!;

        public int Sort { get; set; }

        public int? Score { get; set; }
    }

    public class TemplateQuestionRequestValidator : AbstractValidator<TemplateQuestionRequest>
    {
        public TemplateQuestionRequestValidator()
        {
            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("NhÃ³m cÃ¢u há»i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("CÃ¢u há»i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.Sort)
                .GreaterThanOrEqualTo(0).WithMessage("Thá»© tá»± cÃ¢u há»i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }
}
