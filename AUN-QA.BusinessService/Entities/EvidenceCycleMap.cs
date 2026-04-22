using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class EvidenceCycleMap
{
    public Guid Id { get; set; }

    public Guid EvidenceId { get; set; }

    public Guid CycleId { get; set; }

    public int ReviewStatus { get; set; }

    public string? FinalDecisionBy { get; set; }

    public DateTime? FinalDecisionAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Cycle Cycle { get; set; } = null!;

    public virtual Evidence Evidence { get; set; } = null!;
}
