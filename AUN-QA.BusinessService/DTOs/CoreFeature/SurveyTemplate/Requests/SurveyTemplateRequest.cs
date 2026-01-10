using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Requests
{
    public class SurveyTemplateRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Title { get; set; } = null!;

        public int StakeholderType { get; set; }

        public string? Description { get; set; }

        public List<TemplateTopicRequest> ListTopic { get; set; } = new();
    }

    public class SurveyTemplateRequestValidator : AbstractValidator<SurveyTemplateRequest>
    {
        public SurveyTemplateRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Tiêu đề khảo sát không được để trống");
            RuleFor(x => x.StakeholderType)
                .GreaterThanOrEqualTo(0).WithMessage("Loại đối tượng không được để trống");

            RuleForEach(x => x.ListTopic)
                .SetValidator(new TemplateTopicRequestValidator());
        }
    }
}
