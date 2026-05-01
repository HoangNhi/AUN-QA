using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class TemplateTextQuestion
{
    public Guid Id { get; set; }

    public Guid TopicId { get; set; }

    public string Content { get; set; } = null!;

    public int Sort { get; set; }

    public bool IsRequired { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<SurveyTextAnswer> SurveyTextAnswers { get; set; } = new List<SurveyTextAnswer>();

    public virtual TemplateTopic Topic { get; set; } = null!;
}
