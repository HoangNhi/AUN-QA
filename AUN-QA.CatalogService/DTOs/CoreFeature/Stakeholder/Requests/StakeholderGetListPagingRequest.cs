using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Stakeholder.Requests
{
    public class StakeholderGetListPagingRequest : GetListPagingRequest
    {
        public int? Type { get; set; }
    }
}
