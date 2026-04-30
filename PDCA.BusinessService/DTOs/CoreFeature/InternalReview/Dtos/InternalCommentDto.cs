namespace AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Dtos
{
    public class InternalCommentDto
    {
        public Guid Id { get; set; }

        public Guid SarReportId { get; set; }

        public string CommentText { get; set; } = string.Empty;

        public string? HighlightedText { get; set; }

        public string? CommentMarkId { get; set; }

        public int ReviewRound { get; set; }

        public DateTime CreatedAt { get; set; }

        public string CreatedBy { get; set; } = string.Empty;

        public string CreatedByName { get; set; } = string.Empty;

        public string? CreatedByAvatar { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
