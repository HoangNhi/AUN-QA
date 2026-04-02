namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos
{
    public class SarFeedbackDto
    {
        public Guid Id { get; set; }

        public Guid SarReportId { get; set; }

        public Guid CycleId { get; set; }

        public string? CriterionCode { get; set; }

        public string CommentText { get; set; } = null!;

        public int CommentType { get; set; }

        public int? RoleId { get; set; }

        public bool IsResolved { get; set; }

        public DateTime? ResolvedAt { get; set; }

        public string? ResolvedBy { get; set; }

        public DateTime CreatedAt { get; set; }

        public string CreatedBy { get; set; } = null!;

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
