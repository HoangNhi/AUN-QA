using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ExternalReviewResult
{
    public Guid Id { get; set; }

    public Guid ExternalReviewId { get; set; }

    public Guid StandardId { get; set; }

    public string? Strengths { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ExternalReview ExternalReview { get; set; } = null!;

    public virtual ICollection<ExternalReviewFinding> ExternalReviewFindings { get; set; } = new List<ExternalReviewFinding>();
}
