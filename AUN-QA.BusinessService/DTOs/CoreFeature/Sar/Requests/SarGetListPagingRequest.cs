using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class SarGetListPagingRequest : GetListPagingRequest
    {
        public int? Status { get; set; }
        public Guid? CycleId { get; set; }
    }
}
