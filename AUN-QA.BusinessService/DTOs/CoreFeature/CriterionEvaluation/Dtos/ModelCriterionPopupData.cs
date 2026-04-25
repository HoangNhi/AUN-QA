using AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos
{
    public class ModelCriterionPopupData
    {
        public List<ModelEvaluationSubmission> Submissions { get; set; } = new();
        public EvaluationSubmissionRequest? MySubmission { get; set; }
        public List<CriterionEvidence> Evidences { get; set; } = new();
        public List<ModelSurveyCampaign> SurveyCampaigns { get; set; } = new();
        public int EvaluationMode { get; set; } = 1; // 1: SCORING_7 (AUN), 2: PASS_FAIL (MOET)
        public OfficialDescriptiveFields? OfficialFields { get; set; }
        public bool IsRevisionAllowed { get; set; }
    }

    public class OfficialDescriptiveFields
    {
        public string? CurrentState { get; set; }
        public string? Strengths { get; set; }
        public string? Weaknesses { get; set; }
        public string? ActionPlan { get; set; }
    }

    public class CriterionEvidence
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public Guid EvidenceCycleMapId { get; set; }
    }
}
