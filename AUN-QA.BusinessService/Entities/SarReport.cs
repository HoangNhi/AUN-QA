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
}
