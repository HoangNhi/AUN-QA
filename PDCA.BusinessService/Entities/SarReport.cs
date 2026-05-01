using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class SarReport
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public int Status { get; set; }

    public byte[]? YdocSnapshot { get; set; }

    public string? RenderedHtml { get; set; }

    public DateTime? LastSavedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public string? SubmittedBy { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovedBy { get; set; }

    public DateTime? RevisionRequestedAt { get; set; }

    public string? RevisionRequestedBy { get; set; }

    public string? RevisionReason { get; set; }

    public int ReviewRound { get; set; }

    public virtual Cycle Cycle { get; set; } = null!;

    public virtual ICollection<InternalComment> InternalComments { get; set; } = new List<InternalComment>();
}
