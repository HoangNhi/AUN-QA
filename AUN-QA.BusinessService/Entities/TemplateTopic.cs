using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class TemplateTopic
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public bool HasTextQuestionPart { get; set; }

    public string? TextQuestionTitle { get; set; }

    public int Sort { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public Guid TemplateId { get; set; }
}
