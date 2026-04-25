using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ExternalReview
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public int Status { get; set; }

    public string? WatermarkText { get; set; }

    public int WatermarkOpacity { get; set; }

    public int WatermarkPosition { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? CompletedBy { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Cycle Cycle { get; set; } = null!;

    public virtual ICollection<ExternalReviewAccount> ExternalReviewAccounts { get; set; } = new List<ExternalReviewAccount>();

    public virtual ICollection<ExternalReviewResult> ExternalReviewResults { get; set; } = new List<ExternalReviewResult>();
}
