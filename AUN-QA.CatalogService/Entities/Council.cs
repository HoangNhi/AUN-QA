using System;
using System.Collections.Generic;

namespace AUN_QA.CatalogService.Entities;

public partial class Council
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public Guid UserId { get; set; }

    public int RoleId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }
}
