namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos
{
    public class ModelCriterionEvaluationItem
    {
        public Guid Id { get; set; }
        public Guid CriterionId { get; set; }
        public string CriterionCode { get; set; } = null!;
        public string CriterionName { get; set; } = null!;
        public bool IsPrerequisite { get; set; }
        public int Status { get; set; }
        public int? OfficialScore { get; set; }
        public bool? OfficialResult { get; set; }
        public int EvidenceCount { get; set; }
        public int MissingEvidenceCount { get; set; }
        public int SubmissionCount { get; set; }
        public int TotalEvaluators { get; set; }
    }
}
