using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Requests
{
    public class StandardSetGetListPagingRequest : GetListPagingRequest
    {
        public bool? IsActived { get; set; }

        public int? EvaluationMode { get; set; }
    }
}
