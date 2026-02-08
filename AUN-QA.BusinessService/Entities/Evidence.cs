using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class Evidence
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public string Code { get; set; } = null!;

    public int Status { get; set; }

    public DateTime? IssueDate { get; set; }

    public string? IssuingAuthority { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public Guid FileTypeId { get; set; }

    public string? RejectionReason { get; set; }

    public string? Description { get; set; }
}
