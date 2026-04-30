namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Dtos;

public class ModelCriterionEvidence
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public Guid EvidenceCycleMapId { get; set; }
}
