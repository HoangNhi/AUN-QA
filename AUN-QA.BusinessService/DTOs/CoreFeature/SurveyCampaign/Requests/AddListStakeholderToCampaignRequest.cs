using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class AddListStakeholderToCampaignRequest
    {
        public Guid CampaignId { get; set; }
        public List<Guid> ListStakeholderId { get; set; } = new();
    }

    public class AddListStakeholderToCampaignRequestValidator : AbstractValidator<AddListStakeholderToCampaignRequest>
    {
        public AddListStakeholderToCampaignRequestValidator()
        {
            RuleFor(x => x.CampaignId)
                .NotEmpty().WithMessage("Chiến dịch khảo sát không được để trống");
            RuleFor(x => x.ListStakeholderId)
                .NotEmpty().WithMessage("Danh sách đối tượng tham gia không được để trống");
        }
    }
}
