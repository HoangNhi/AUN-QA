namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;

public class ActionPlanAssigneeDto
{
    public Guid Id { get; set; }

    public Guid ActionPlanId { get; set; }

    public Guid UserId { get; set; }

    public DateTime AssignedAt { get; set; }

    public string AssignedBy { get; set; } = string.Empty;

    public string? Fullname { get; set; }

    public string? Username { get; set; }
}
