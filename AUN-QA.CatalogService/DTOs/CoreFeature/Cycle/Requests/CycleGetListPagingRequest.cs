using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests
{
    public class CycleGetListPagingRequest : GetListPagingRequest
    {
        public int? Status { get; set; }

        public int? Scope { get; set; }

        public int? Year { get; set; }
    }
}
