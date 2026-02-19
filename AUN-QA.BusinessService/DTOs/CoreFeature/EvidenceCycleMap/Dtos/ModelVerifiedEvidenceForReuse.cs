namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Dtos
{
    public class ModelVerifiedEvidenceForReuse
    {
        public Guid Id { get; set; }
        public Guid EvidenceId { get; set; }
        public string Evidence_Name { get; set; } = string.Empty;
        public string Evidence_Code { get; set; } = string.Empty;
        public Guid? FileTypeId { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Description { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? IssuingAuthority { get; set; }
    }
}
