namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos
{
    public class ModelExternalReviewFinding
    {
        public Guid Id { get; set; }
        public Guid ExternalReviewResultId { get; set; }
        public int FindingType { get; set; }
        public string Content { get; set; } = string.Empty;
        public Guid? CriterionId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
    }
}
