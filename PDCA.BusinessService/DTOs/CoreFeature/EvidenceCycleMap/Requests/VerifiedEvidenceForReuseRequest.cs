using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests
{
    public class VerifiedEvidenceForReuseRequest : GetListPagingRequest
    {
        public Guid? FileTypeId { get; set; }
        public Guid? TargetCycleId { get; set; }
    }
}
