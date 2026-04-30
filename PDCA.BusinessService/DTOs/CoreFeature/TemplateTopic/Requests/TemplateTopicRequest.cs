using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests
{
    public class TemplateTopicRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public bool HasTextQuestionPart { get; set; }

        public string? TextQuestionTitle { get; set; }

        public int Sort { get; set; }

        public Guid? TemplateId { get; set; }

        public Guid? CampaignId { get; set; }

        public List<TemplateCategoryRequest> ListCategory { get; set; } = new();
        public List<TemplateTextQuestionRequest> ListTextQuestion { get; set; } = new();
    }

    public class TemplateTopicRequestValidator : AbstractValidator<TemplateTopicRequest>
    {
        public TemplateTopicRequestValidator()
        {
            RuleFor(x => x.Title).NotEmpty().WithMessage("Tiêu đề không được để trống");
            RuleFor(x => x.Sort).GreaterThanOrEqualTo(0).WithMessage("Thứ tự sắp xếp không được nhỏ hơn 0");

            When(x => x.HasTextQuestionPart, () =>
            {
                RuleFor(x => x.TextQuestionTitle).NotEmpty().WithMessage("Tiêu đề phần câu hỏi mở không được để trống khi có phần câu hỏi mở");
            });

            RuleForEach(x => x.ListCategory).SetValidator(new TemplateCategoryRequestValidator());
            RuleForEach(x => x.ListTextQuestion).SetValidator(new TemplateTextQuestionRequestValidator());
        }
    }
}
