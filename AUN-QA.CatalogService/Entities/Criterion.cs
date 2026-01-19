using System;
using System.Collections.Generic;

namespace AUN_QA.CatalogService.Entities;

public partial class Criterion
{
    public Guid Id { get; set; }

    public Guid StandardId { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string Guidance { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Standard? Standard { get; set; }
}
