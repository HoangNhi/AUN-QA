using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Score.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.TextAnswer.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class SurveyCampaignRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public Guid TemplateId { get; set; }

        public int StakeholderType { get; set; }

        public string Name { get; set; } = null!;

        public int Status { get; set; }

        public List<SurveySessionRequest> ListSession { get; set; } = new();

        public List<SurveyScoreRequest> ListScore { get; set; } = new();

        public List<SurveyTextAnswerRequest> ListTextAnswer { get; set; } = new();
    }

    public class SurveyCampaignRequestValidator : AbstractValidator<SurveyCampaignRequest>
    {
        public SurveyCampaignRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("Chu kỳ khảo sát không được để trống");

            RuleFor(x => x.TemplateId)
                .NotEmpty().WithMessage("Mẫu khảo sát không được để trống");

            RuleFor(x => x.StakeholderType)
                .NotEmpty().WithMessage("Loại đối tượng tham gia không được để trống");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên chiến dịch khảo sát không được để trống");

            RuleForEach(x => x.ListSession)
                .SetValidator(new SurveySessionRequestValidator());

            RuleForEach(x => x.ListScore)
                .SetValidator(new SurveyScoreRequestValidator());

            RuleForEach(x => x.ListTextAnswer)
                .SetValidator(new SurveyTextAnswerRequestValidator());
        }
    }
}
