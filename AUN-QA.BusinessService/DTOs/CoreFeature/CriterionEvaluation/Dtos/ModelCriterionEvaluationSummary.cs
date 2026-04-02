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
        public string? MoetProgramVerdict { get; set; }
    }
}
