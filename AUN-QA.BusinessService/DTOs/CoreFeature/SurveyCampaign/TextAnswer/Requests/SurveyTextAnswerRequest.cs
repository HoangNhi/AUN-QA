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
                .NotEmpty().WithMessage("Câu hỏi văn bản không được để trống");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Nội dung trả lời không được để trống");
        }
    }
}
