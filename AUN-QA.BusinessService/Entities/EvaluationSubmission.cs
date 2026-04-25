using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class EvaluationSubmission
{
    public Guid Id { get; set; }

    public Guid CriterionEvaluationId { get; set; }

    public Guid EvaluatorId { get; set; }

    public string? CurrentState { get; set; }

    public string? Strengths { get; set; }

    public string? Weaknesses { get; set; }

    public string? ActionPlan { get; set; }

    public int? ProposedScore { get; set; }

    public bool? ProposedResult { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsDeleted { get; set; }

    public bool IsActived { get; set; }

    public virtual CriterionEvaluation CriterionEvaluation { get; set; } = null!;
}
