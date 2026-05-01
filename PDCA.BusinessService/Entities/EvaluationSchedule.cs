using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class EvaluationSchedule
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public string ActivityName { get; set; } = null!;

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public Guid LeadId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Cycle Cycle { get; set; } = null!;
}
