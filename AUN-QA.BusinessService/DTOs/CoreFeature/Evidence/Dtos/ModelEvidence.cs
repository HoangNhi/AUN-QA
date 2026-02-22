using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Evidence.Dtos
{
    public class ModelEvidence : BaseModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string Code { get; set; } = null!;

        public int Status { get; set; }

        public DateTime? IssueDate { get; set; }

        public string? IssuingAuthority { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public Guid FileTypeId { get; set; }

        public string? RejectionReason { get; set; }

        public string? Description { get; set; }

        #region Attachment
        public List<Guid> AttachmentIds { get; set; } = new List<Guid>();
        public List<ModelAttachment> ListAttachment { get; set; } = new List<ModelAttachment>();
        #endregion
    }
}
