namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos
{
    public class ModelCriterionEvaluationSummary
    {
        public int TotalCriteria { get; set; }
        public int ApprovedCriteria { get; set; }
        public int PrerequisiteTotal { get; set; }
        public int PrerequisitePassed { get; set; }
        public int FailedStandards { get; set; }
        public int FailedCriteria { get; set; }
        public int? AunProgramVerdict { get; set; }
        public string? MoetProgramVerdict { get; set; }

        // Comparison with previous cycle (nullable = no previous cycle available)
        public Guid? PreviousCycleId { get; set; }
        public string? PreviousCycleName { get; set; }
        public int? PreviousApprovedCriteria { get; set; }
        public int? PreviousFailedCriteria { get; set; }
        public int? PreviousFailedStandards { get; set; }
        public string? PreviousMoetProgramVerdict { get; set; }
        public int? ImprovedCriteria { get; set; }
        public int? RegressedCriteria { get; set; }
    }
}
