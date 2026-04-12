namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos
{
    public class ModelExternalReviewResult
    {
        public Guid Id { get; set; }
        public Guid ExternalReviewId { get; set; }
        public Guid StandardId { get; set; }
        public string? Strengths { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public List<ModelExternalReviewFinding> Findings { get; set; } = new();
    }
}
