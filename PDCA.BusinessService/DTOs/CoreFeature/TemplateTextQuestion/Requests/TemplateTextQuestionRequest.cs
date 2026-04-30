using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests
{
    public class TemplateTextQuestionRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid TopicId { get; set; }

        public string Content { get; set; } = null!;

        public int Sort { get; set; }

        public bool IsRequired { get; set; } = true;

        public string? Answer { get; set; }
    }

    public class TemplateTextQuestionRequestValidator : AbstractValidator<TemplateTextQuestionRequest>
    {
        public TemplateTextQuestionRequestValidator()
        {
            RuleFor(x => x.TopicId).NotEmpty().WithMessage("Chủ đề không được để trống");
            RuleFor(x => x.Content).NotEmpty().WithMessage("Câu hỏi không được để trống");
            RuleFor(x => x.Sort).GreaterThanOrEqualTo(0).WithMessage("Thứ tự sắp xếp không được nhỏ hơn 0");
        }
    }
}
