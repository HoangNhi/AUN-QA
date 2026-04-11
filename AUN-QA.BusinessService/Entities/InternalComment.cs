using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class InternalComment
{
    public Guid Id { get; set; }

    public Guid SarReportId { get; set; }

    public string CommentText { get; set; } = null!;

    public string? HighlightedText { get; set; }

    public string? CommentMarkId { get; set; }

    public int ReviewRound { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual SarReport SarReport { get; set; } = null!;
}
