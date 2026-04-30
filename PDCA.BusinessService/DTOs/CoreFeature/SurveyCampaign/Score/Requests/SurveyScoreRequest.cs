using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Score.Requests
{
    public class SurveyScoreRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid SessionId { get; set; }

        public Guid QuestionId { get; set; }

        public int Score { get; set; }
    }

    public class SurveyScoreRequestValidator : AbstractValidator<SurveyScoreRequest>
    {
        public SurveyScoreRequestValidator()
        {
            RuleFor(x => x.QuestionId)
                .NotEmpty().WithMessage("Câu hỏi không được để trống");

            RuleFor(x => x.Score)
                .InclusiveBetween(1, 5).WithMessage("Điểm số phải từ 1 đến 5");
        }
    }
}
