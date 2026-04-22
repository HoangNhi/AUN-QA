using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class Cycle
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public int Year { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int Status { get; set; }

    public string EvaluationPurpose { get; set; } = null!;

    public int Scope { get; set; }

    public Guid StandardSetId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<ActionPlan> ActionPlans { get; set; } = new List<ActionPlan>();

    public virtual ICollection<Council> Councils { get; set; } = new List<Council>();

    public virtual ICollection<CriterionEvaluation> CriterionEvaluations { get; set; } = new List<CriterionEvaluation>();

    public virtual ICollection<EvaluationSchedule> EvaluationSchedules { get; set; } = new List<EvaluationSchedule>();

    public virtual ICollection<EvidenceCycleMap> EvidenceCycleMaps { get; set; } = new List<EvidenceCycleMap>();

    public virtual ICollection<ExternalReview> ExternalReviews { get; set; } = new List<ExternalReview>();

    public virtual ICollection<SarReport> SarReports { get; set; } = new List<SarReport>();

    public virtual ICollection<SurveyCampaign> SurveyCampaigns { get; set; } = new List<SurveyCampaign>();
}
