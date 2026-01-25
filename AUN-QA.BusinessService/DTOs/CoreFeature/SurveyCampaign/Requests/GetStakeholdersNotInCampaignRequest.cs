using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class GetStakeholdersNotInCampaignRequest : GetListPagingRequest
    {
        public Guid CampainId { get; set; }
    }

    public class GetStakeholdersNotInCampaignRequestValidator : AbstractValidator<GetStakeholdersNotInCampaignRequest>
    {
        public GetStakeholdersNotInCampaignRequestValidator()
        {
            RuleFor(x => x.CampainId).NotEmpty().WithMessage("Chiến dịch không được để trống");
        }
    }
}
