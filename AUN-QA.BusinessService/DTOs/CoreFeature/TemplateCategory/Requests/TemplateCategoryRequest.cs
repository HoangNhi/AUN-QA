using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests
{
    public class TemplateCategoryRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid TopicId { get; set; }

        public string Name { get; set; } = null!;

        public int Sort { get; set; }

        public List<TemplateQuestionRequest> ListQuestion { get; set; } = new();
    }

    public class TemplateCategoryRequestValidator : AbstractValidator<TemplateCategoryRequest>
    {
        public TemplateCategoryRequestValidator()
        {
            RuleFor(x => x.TopicId).NotEmpty().WithMessage("Chá»§ Ä‘á» khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Name).NotEmpty().WithMessage("TÃªn danh má»¥c khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Sort).GreaterThanOrEqualTo(0).WithMessage("Thá»© tá»± sáº¯p xáº¿p khÃ´ng Ä‘Æ°á»£c nhá» hÆ¡n 0");

            RuleForEach(x => x.ListQuestion).SetValidator(new TemplateQuestionRequestValidator());
        }
    }
}
