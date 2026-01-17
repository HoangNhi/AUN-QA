using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests
{
    public class SurveySessionRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CampaignId { get; set; }

        public int StakeholderId { get; set; }

        public string? StakeholderName { get; set; }

        public string? StakeholderEmail { get; set; }

        public string? Token { get; set; }

        /// <summary>
        /// 1. Chưa gửi, 2. Đã gửi, 3. Đã nộp
        /// </summary>
        public int Status { get; set; } = 1;

        public DateTime? SentDate { get; set; }

        public DateTime? SubmittedDate { get; set; }
    }

    public class SurveySessionRequestValidator : AbstractValidator<SurveySessionRequest>
    {
        public SurveySessionRequestValidator()
        {
            RuleFor(x => x.CampaignId)
                .NotEmpty().WithMessage("Khảo sát không được để trống");

            RuleFor(x => x.StakeholderId)
                .NotEmpty().WithMessage("Người tham gia không được để trống");
        }
    }
}
