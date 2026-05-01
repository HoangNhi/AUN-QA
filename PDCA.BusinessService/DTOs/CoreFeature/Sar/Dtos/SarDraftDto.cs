namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos
{
    public class SarDraftDto
    {
        public Guid SarReportId { get; set; }

        public Guid CycleId { get; set; }

        public int Status { get; set; }

        public int ReviewRound { get; set; }

        public int? CurrentUserCouncilRoleId { get; set; }

        public bool CanSubmitByRole { get; set; }

        public bool CanEditByRole { get; set; }

        public bool CanApproveByRole { get; set; }

        public string? YDocSnapshotBase64 { get; set; }

        public string? RenderedHtml { get; set; }

        public string? RevisionReason { get; set; }

        public DateTime? SubmittedAt { get; set; }

        public string? SubmittedBy { get; set; }

        public DateTime? LastSavedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public string CreatedBy { get; set; } = null!;

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
