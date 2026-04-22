using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class TemplateCategory
{
    public Guid Id { get; set; }

    public Guid TopicId { get; set; }

    public string Name { get; set; } = null!;

    public int Sort { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<TemplateQuestion> TemplateQuestions { get; set; } = new List<TemplateQuestion>();

    public virtual TemplateTopic Topic { get; set; } = null!;
}
