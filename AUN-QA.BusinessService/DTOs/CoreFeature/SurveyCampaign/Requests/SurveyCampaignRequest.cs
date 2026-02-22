using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class SurveyCampaignRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid? CycleId { get; set; }

        public Guid? TemplateId { get; set; }

        public int? StakeholderType { get; set; }

        public string Name { get; set; } = null!;

        /// <summary>
        /// 1. ChÆ°a gá»­i, 2. ÄÃ£ gá»­i, 3. ÄÃ£ hoÃ n thÃ nh
        /// </summary>
        public int? Status { get; set; } = ((int)SurveyCampaignStatus.Draft);

        public List<TemplateTopicRequest> ListTopic { get; set; } = new();
    }

    public class SurveyCampaignRequestValidator : AbstractValidator<SurveyCampaignRequest>
    {
        public SurveyCampaignRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("Chu ká»³ kháº£o sÃ¡t khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.TemplateId)
                .NotEmpty().WithMessage("Máº«u kháº£o sÃ¡t khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.StakeholderType)
                .NotEmpty().WithMessage("Loáº¡i Ä‘á»‘i tÆ°á»£ng tham gia khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("TÃªn chiáº¿n dá»‹ch kháº£o sÃ¡t khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleForEach(x => x.ListTopic)
                .SetValidator(new TemplateTopicRequestValidator());
        }
    }
}
