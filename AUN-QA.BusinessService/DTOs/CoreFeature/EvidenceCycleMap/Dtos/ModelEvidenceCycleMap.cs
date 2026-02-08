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

        #region Display Fields
        public string? EvidenceName { get; set; }

        public string? EvidenceCode { get; set; }

        public string? CycleName { get; set; }

        public string? ReviewStatusName { get; set; }
        #endregion

        #region Evidence Fields
        public string? Name { get; set; }

        public string? Code { get; set; }

        public int Status { get; set; }

        public DateTime? IssueDate { get; set; }

        public string? IssuingAuthority { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public Guid FileTypeId { get; set; }

        public string? RejectionReason { get; set; }

        public string? Description { get; set; }
        #endregion

        #region Attachment
        public List<Guid> AttachmentIds { get; set; } = new List<Guid>();

        public List<ModelAttachment> ListAttachment { get; set; } = new List<ModelAttachment>();
        #endregion
    }
}
