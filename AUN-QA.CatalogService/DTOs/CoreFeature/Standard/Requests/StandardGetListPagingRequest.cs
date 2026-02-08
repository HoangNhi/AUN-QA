using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests
{
    public class StandardGetListPagingRequest : GetListPagingRequest
    {
        public Guid? StandardSetId { get; set; }
        public bool? IsActived { get; set; }
    }
}
