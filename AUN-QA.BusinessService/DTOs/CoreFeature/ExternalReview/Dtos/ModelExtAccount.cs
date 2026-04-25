namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos
{
    public class ModelExtAccount
    {
        public Guid Id { get; set; }
        public Guid ExternalReviewId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? Fullname { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public bool IsActived { get; set; }
    }
}
