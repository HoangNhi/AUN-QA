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
        /// 1. ChÆ°a gá»­i, 2. ÄÃ£ gá»­i, 3. ÄÃ£ hoÃ n thÃ nh
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
                .NotEmpty().WithMessage("Kháº£o sÃ¡t khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.StakeholderId)
                .NotEmpty().WithMessage("NgÆ°á»i tham gia khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }
}
