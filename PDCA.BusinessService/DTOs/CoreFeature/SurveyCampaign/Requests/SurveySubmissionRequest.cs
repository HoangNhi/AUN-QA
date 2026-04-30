using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Score.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.TextAnswer.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class SurveySubmissionRequest
    {
        public string Token { get; set; } = string.Empty;
        public List<SurveyScoreRequest> Scores { get; set; } = new();
        public List<SurveyTextAnswerRequest> TextAnswers { get; set; } = new();
    }

    public class SurveySubmissionRequestValidator : AbstractValidator<SurveySubmissionRequest>
    {
        public SurveySubmissionRequestValidator()
        {
            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("Đường dẫn không hợp lệ");

            RuleFor(x => x.Scores)
                .NotNull().WithMessage("Câu trả lời không được để trống")
                .ForEach(score =>
                {
                    score.SetValidator(new SurveyScoreRequestValidator());
                });

            RuleFor(x => x.TextAnswers)
                .NotNull().WithMessage("Câu trả lời khác không được để trống")
                .ForEach(textAnswer =>
                {
                    textAnswer.SetValidator(new SurveyTextAnswerRequestValidator());
                });
        }
    }
}
