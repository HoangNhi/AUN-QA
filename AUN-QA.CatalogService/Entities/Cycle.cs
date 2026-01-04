using System;
using System.Collections.Generic;

namespace AUN_QA.CatalogService.Entities;

public partial class Cycle
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public int Year { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int Status { get; set; }

    public string EvaluationPurpose { get; set; } = null!;

    public int Scope { get; set; }

    public DateTime CreatedAt { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }
}
