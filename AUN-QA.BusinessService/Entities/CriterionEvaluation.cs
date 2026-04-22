using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class CriterionEvaluation
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public Guid CriterionId { get; set; }

    public Guid StandardId { get; set; }

    public int Status { get; set; }

    public int? OfficialScore { get; set; }

    public bool? OfficialResult { get; set; }

    public string? ApprovedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public string? OfficialStrengths { get; set; }

    public string? OfficialWeaknesses { get; set; }

    public string? OfficialActionPlan { get; set; }

    public string? OfficialCurrentState { get; set; }

    public virtual Cycle Cycle { get; set; } = null!;

    public virtual ICollection<EvaluationSubmission> EvaluationSubmissions { get; set; } = new List<EvaluationSubmission>();
}
