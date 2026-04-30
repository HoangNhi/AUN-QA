using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ActionPlanAttachment
{
    public Guid Id { get; set; }

    public Guid RelatedId { get; set; }

    public string? FileName { get; set; }

    public string? FileExtension { get; set; }

    public double? FileSize { get; set; }

    public string? FileUrl { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ActionPlan Related { get; set; } = null!;
}
