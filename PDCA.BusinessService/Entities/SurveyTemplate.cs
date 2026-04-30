using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class SurveyTemplate
{
    public Guid Id { get; set; }

    public string Title { get; set; } = null!;

    public int StakeholderType { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<SurveyCampaign> SurveyCampaigns { get; set; } = new List<SurveyCampaign>();

    public virtual ICollection<TemplateTopic> TemplateTopics { get; set; } = new List<TemplateTopic>();
}
