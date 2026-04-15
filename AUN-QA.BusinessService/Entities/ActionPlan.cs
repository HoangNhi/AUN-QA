using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ActionPlan
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public Guid? StandardId { get; set; }

    public Guid? CriterionId { get; set; }

    public int Priority { get; set; }

    public DateTime Deadline { get; set; }

    public string Kpi { get; set; } = null!;

    public int Status { get; set; }

    public Guid? SourceFindingId { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public string? SubmittedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovedBy { get; set; }

    public DateTime? RevisionRequestedAt { get; set; }

    public string? RevisionRequestedBy { get; set; }

    public string? RevisionReason { get; set; }

    public DateTime? AssignedAt { get; set; }

    public string? AssignedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<ActionPlanAssignee> ActionPlanAssignees { get; set; } = new List<ActionPlanAssignee>();

    public virtual ICollection<ActionTask> ActionTasks { get; set; } = new List<ActionTask>();

    public virtual Cycle Cycle { get; set; } = null!;

    public virtual ExternalReviewFinding? SourceFinding { get; set; }
}
