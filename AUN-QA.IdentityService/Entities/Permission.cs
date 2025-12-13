using System;
using System.Collections.Generic;

namespace AUN_QA.IdentityService.Entities;

public partial class Permission
{
    public Guid Id { get; set; }

    public Guid RoleId { get; set; }

    public Guid MenuId { get; set; }

    public bool? CanView { get; set; }

    public bool? CanAdd { get; set; }

    public bool? CanUpdate { get; set; }

    public bool? CanDelete { get; set; }

    public bool? CanApprove { get; set; }

    public bool? CanAnalyze { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }
}
