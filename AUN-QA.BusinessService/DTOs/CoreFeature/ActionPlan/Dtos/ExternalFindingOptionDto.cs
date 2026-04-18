namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;

public class ExternalFindingOptionDto
{
    public Guid Id { get; set; }

    public Guid ExternalReviewResultId { get; set; }

    public Guid? CriterionId { get; set; }

    public Guid? StandardId { get; set; }

    public string Content { get; set; } = string.Empty;

    public string? Summary { get; set; }

    public string? StandardCode { get; set; }

    public string? StandardName { get; set; }

    public string? CriterionCode { get; set; }

    public string? CriterionName { get; set; }
}
