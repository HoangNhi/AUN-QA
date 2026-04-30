using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests
{
    public class SurveySessionRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CampaignId { get; set; }

        public Guid StakeholderId { get; set; }

        public string StakeholderName { get; set; } = null!;

        public string StakeholderEmail { get; set; } = null!;

        public string? Token { get; set; }

        /// <summary>
        /// 1. Chưa gửi, 2. Đã gửi, 3. Đã hoàn thành
        /// </summary>
        public int? Status { get; set; } = ((int)SurveySessionStatus.Draft);

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
