namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos
{
    public class SarGetListItemDto
    {
        public Guid SarReportId { get; set; }

        public Guid CycleId { get; set; }

        public string CycleName { get; set; } = null!;

        public int Year { get; set; }

        public int Status { get; set; }

        public DateTime? LastSavedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }

        public string? EvaluationPurpose { get; set; }
    }
}
