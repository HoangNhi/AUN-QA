using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Requests
{
    public class EvidenceGetListPagingRequest : GetListPagingRequest
    {
        public int? Status { get; set; }

        public Guid? FileTypeId { get; set; }
    }
}
