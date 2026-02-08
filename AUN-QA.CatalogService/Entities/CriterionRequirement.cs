using System;
using System.Collections.Generic;

namespace AUN_QA.CatalogService.Entities;

public partial class CriterionRequirement
{
    public Guid Id { get; set; }

    public Guid CriterionId { get; set; }

    public Guid FileTypeId { get; set; }

    public bool IsMandatory { get; set; }

    public int MinQuantity { get; set; }

    public string? Suggestion { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }
}
