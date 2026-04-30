using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class TemplateQuestion
{
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    public string Content { get; set; } = null!;

    public int Sort { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public bool IsRequired { get; set; }

    public virtual TemplateCategory Category { get; set; } = null!;

    public virtual ICollection<SurveyScore> SurveyScores { get; set; } = new List<SurveyScore>();
}
