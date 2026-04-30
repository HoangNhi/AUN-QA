using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ActionTask
{
    public Guid Id { get; set; }

    public Guid ActionPlanId { get; set; }

    public string Description { get; set; } = null!;

    public string? Note { get; set; }

    public int TaskStatus { get; set; }

    public DateTime? DueDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ActionPlan ActionPlan { get; set; } = null!;

    public virtual ICollection<ActionTaskAttachment> ActionTaskAttachments { get; set; } = new List<ActionTaskAttachment>();
}
