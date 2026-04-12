using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ExternalReviewAccount
{
    public Guid Id { get; set; }

    public Guid ExternalReviewId { get; set; }

    public Guid UserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public virtual ExternalReview ExternalReview { get; set; } = null!;
}
