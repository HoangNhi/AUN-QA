namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests
{
    public class CriterionEvaluationGetListRequest
    {
        public Guid CycleId { get; set; }
        public Guid StandardSetId { get; set; }
        public string? TextSearch { get; set; }
        public int? Status { get; set; }
    }
}
