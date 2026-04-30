namespace AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;

public class AssignableMemberDto
{
    public Guid UserId { get; set; }

    public string Fullname { get; set; } = string.Empty;

    public string? Username { get; set; }
}
