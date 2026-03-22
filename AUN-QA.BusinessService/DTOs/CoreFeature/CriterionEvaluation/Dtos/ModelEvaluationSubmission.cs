namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos
{
    public class ModelEvaluationSubmission
    {
        public Guid Id { get; set; }
        public Guid EvaluatorId { get; set; }
        public string EvaluatorName { get; set; } = null!;
        public string? CurrentState { get; set; }
        public string? Strengths { get; set; }
        public string? Weaknesses { get; set; }
        public string? ActionPlan { get; set; }
        public int? ProposedScore { get; set; }
        public bool? ProposedResult { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
