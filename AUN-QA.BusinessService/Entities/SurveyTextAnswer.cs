using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class SurveyTextAnswer
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public Guid TextQuestionId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }
}
