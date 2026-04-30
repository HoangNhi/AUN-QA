namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos
{
    public class ExternalReviewListItemDto
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public string CycleName { get; set; } = string.Empty;

        public int Year { get; set; }

        public int Status { get; set; }

        public bool IsCompleted { get; set; }

        public int AccountCount { get; set; }

        public int ResultCount { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
