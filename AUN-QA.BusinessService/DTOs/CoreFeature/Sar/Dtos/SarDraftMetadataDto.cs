namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos
{
    public class SarDraftMetadataDto
    {
        public Guid SarReportId { get; set; }

        public Guid CycleId { get; set; }

        public int Status { get; set; }

        public int ReviewRound { get; set; }

        public bool CanSubmitByRole { get; set; }

        public bool CanEditByRole { get; set; }

        public string? RevisionReason { get; set; }

        public DateTime? LastSavedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
