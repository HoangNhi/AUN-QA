namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos
{
    public class ModelStandardEvaluationGroup
    {
        public Guid StandardId { get; set; }
        public string StandardCode { get; set; } = null!;
        public string StandardName { get; set; } = null!;
        public bool IsPassed { get; set; }
        public int? StandardScore { get; set; }
        public int ApprovedCount { get; set; }
        public int TotalCount { get; set; }
        public List<ModelCriterionEvaluationItem> Items { get; set; } = new();
    }
}
