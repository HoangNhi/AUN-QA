using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class Evidence
{
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public Guid FileTypeId { get; set; }

    public DateTime? IssueDate { get; set; }

    public string? IssuingAuthority { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public string? Description { get; set; }

    public int Status { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public string? ApprovedBy { get; set; }
}
