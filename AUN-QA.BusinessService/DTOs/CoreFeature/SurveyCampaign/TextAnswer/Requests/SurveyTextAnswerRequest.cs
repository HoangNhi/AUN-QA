using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.TextAnswer.Requests
{
    public class SurveyTextAnswerRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid SessionId { get; set; }

        public Guid TextQuestionId { get; set; }

        public string Content { get; set; } = null!;
    }

    public class SurveyTextAnswerRequestValidator : AbstractValidator<SurveyTextAnswerRequest>
    {
        public SurveyTextAnswerRequestValidator()
        {
            RuleFor(x => x.TextQuestionId)
                .NotEmpty().WithMessage("CÃ¢u há»i vÄƒn báº£n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Ná»™i dung tráº£ lá»i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }
}
