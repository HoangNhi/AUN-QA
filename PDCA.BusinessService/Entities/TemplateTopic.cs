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

    public Guid? TemplateId { get; set; }

    public Guid? CampaignId { get; set; }

    public virtual SurveyCampaign? Campaign { get; set; }

    public virtual SurveyTemplate? Template { get; set; }

    public virtual ICollection<TemplateCategory> TemplateCategories { get; set; } = new List<TemplateCategory>();

    public virtual ICollection<TemplateTextQuestion> TemplateTextQuestions { get; set; } = new List<TemplateTextQuestion>();
}
