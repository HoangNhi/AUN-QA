using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class AddAllStakeholderToCampaignRequest
    {
        public Guid CampaignId { get; set; }

        public string? Filter_TextSearch { get; set; }
    }

    public class AddAllStakeholderToCampaignRequestValidator : AbstractValidator<AddAllStakeholderToCampaignRequest>
    {
        public AddAllStakeholderToCampaignRequestValidator()
        {
            RuleFor(x => x.CampaignId)
                .NotEmpty().WithMessage("Chiến dịch khảo sát không được để trống");
        }
    }
}
