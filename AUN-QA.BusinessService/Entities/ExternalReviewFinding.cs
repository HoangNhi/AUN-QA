using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ExternalReviewFinding
{
    public Guid Id { get; set; }

    public Guid ExternalReviewResultId { get; set; }

    public int FindingType { get; set; }

    public string Content { get; set; } = null!;

    public Guid? CriterionId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ExternalReviewResult ExternalReviewResult { get; set; } = null!;
}
