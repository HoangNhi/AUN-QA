using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;

namespace AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation
{
    public interface ICriterionEvaluationService
    {
        Task<ModelCriterionEvaluationSummary> GetSummary(GetCriterionEvaluationSummaryRequest request);
        Task<List<ModelStandardEvaluationGroup>> GetList(CriterionEvaluationGetListRequest request);
        Task<List<ModelEvaluationSubmission>> GetSubmissions(Guid criterionEvaluationId);
        Task<EvaluationSubmissionRequest?> GetMySubmission(Guid criterionEvaluationId);
        Task Submit(EvaluationSubmissionRequest request);
        Task Approve(ApproveEvaluationRequest request);
        Task InitializeForCycle(InitializeCycleEvaluationRequest request);
        Task<List<ModelCriterionEvidence>> GetEvidencesForCriterion(Guid criterionEvaluationId, Guid cycleId);
        Task<ModelCriterionPopupData> GetPopupData(GetPopupDataRequest request);
    }
}
