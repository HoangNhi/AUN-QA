using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class SurveySession
{
    public Guid Id { get; set; }

    public Guid CampaignId { get; set; }

    public int StakeholderId { get; set; }

    public string StakeholderName { get; set; } = null!;

    public string StakeholderEmail { get; set; } = null!;

    public string Token { get; set; } = null!;

    public int Status { get; set; }

    public DateTime? SentDate { get; set; }

    public DateTime? SubmittedDate { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }
}
