using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos
{
    public class ModelEvidenceCycleMap : BaseModel
    {
        public Guid Id { get; set; }

        public Guid EvidenceId { get; set; }

        public Guid CycleId { get; set; }

        public int ReviewStatus { get; set; } = ((int)EvidenceCycleMapReviewStatus.NotStarted);

        public string? FinalDecisionBy { get; set; }

        public DateTime? FinalDecisionAt { get; set; }
    }


}
