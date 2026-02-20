using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests
{
    public class EvidenceCycleMapGetListPagingRequest : GetListPagingRequest
    {
        public Guid? CycleId { get; set; }

        public int? ReviewStatus { get; set; }

        public int? EvidenceStatus { get; set; }

        public Guid? FileTypeId { get; set; }
    }
}
