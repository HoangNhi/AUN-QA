namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos
{
    public class ModelExternalReview
    {
        public Guid Id { get; set; }
        public Guid CycleId { get; set; }
        public int Status { get; set; }
        public string? WatermarkText { get; set; }
        public int WatermarkOpacity { get; set; }
        public int WatermarkPosition { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string? CompletedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get; set; }
        public List<ModelExternalReviewResult> Results { get; set; } = new();
        public int? CurrentUserCouncilRoleId { get; set; }
        public bool IsAdmin { get; set; }
    }
}
