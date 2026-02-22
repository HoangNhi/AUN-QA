using AUN_QA.Shared.DTOs.Base;
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
                .NotEmpty().WithMessage("TiÃªu Ä‘á» kháº£o sÃ¡t khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
                .MaximumLength(255).WithMessage("TiÃªu Ä‘á» kháº£o sÃ¡t khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 255 kÃ½ tá»±");
            RuleFor(x => x.StakeholderType)
                .GreaterThanOrEqualTo(0).WithMessage("Loáº¡i Ä‘á»‘i tÆ°á»£ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleForEach(x => x.ListTopic)
                .SetValidator(new TemplateTopicRequestValidator());
        }
    }
}
