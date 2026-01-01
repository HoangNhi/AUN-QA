using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Dtos
{
    public class ModelEvaluationSchedule : BaseModel
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public string ActivityName { get; set; } = null!;

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public Guid LeadId { get; set; }
    }
}
