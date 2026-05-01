using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ActionPlanAssignee
{
    public Guid Id { get; set; }

    public Guid ActionPlanId { get; set; }

    public Guid UserId { get; set; }

    public DateTime AssignedAt { get; set; }

    public string AssignedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ActionPlan ActionPlan { get; set; } = null!;
}
