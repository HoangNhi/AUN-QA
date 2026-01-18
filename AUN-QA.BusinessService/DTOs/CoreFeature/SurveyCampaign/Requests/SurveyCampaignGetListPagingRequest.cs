using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class SurveyCampaignGetListPagingRequest : GetListPagingRequest
    {
        public Guid? CycleId { get; set; }

        public int? StakeholderType { get; set; }
    }
}
