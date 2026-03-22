namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests
{
    public class GetCriterionEvaluationSummaryRequest
    {
        public Guid CycleId { get; set; }
        public Guid StandardSetId { get; set; }
    }
}
