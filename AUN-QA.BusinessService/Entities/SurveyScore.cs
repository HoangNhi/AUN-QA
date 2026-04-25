using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class SurveyScore
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public Guid QuestionId { get; set; }

    public int Score { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual TemplateQuestion Question { get; set; } = null!;

    public virtual SurveySession Session { get; set; } = null!;
}
