using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class SurveyCampaign
{
    public Guid Id { get; set; }

    public Guid CycleId { get; set; }

    public Guid TemplateId { get; set; }

    public int StakeholderType { get; set; }

    public string Name { get; set; } = null!;

    public int Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Cycle Cycle { get; set; } = null!;

    public virtual ICollection<SurveySession> SurveySessions { get; set; } = new List<SurveySession>();

    public virtual SurveyTemplate Template { get; set; } = null!;

    public virtual ICollection<TemplateTopic> TemplateTopics { get; set; } = new List<TemplateTopic>();
}
