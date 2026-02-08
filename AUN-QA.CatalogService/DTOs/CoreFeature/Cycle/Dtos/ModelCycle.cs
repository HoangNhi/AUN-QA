using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Requests;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos
{
    public class ModelCycle : BaseModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public int Year { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        // 1: Plan, 2: On going, 3: Close
        public int Status { get; set; } = 1;

        public string EvaluationPurpose { get; set; } = null!;

        public int Scope { get; set; }

        public Guid StandardSetId { get; set; }

        public List<CouncilRequest> ListCouncil { get; set; } = new();

        public List<EvaluationScheduleRequest> ListEvaluationSchedule { get; set; } = new();
    }
}
