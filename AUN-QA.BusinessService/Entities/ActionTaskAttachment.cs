using System;
using System.Collections.Generic;

namespace AUN_QA.BusinessService.Entities;

public partial class ActionTaskAttachment
{
    public Guid Id { get; set; }

    public Guid ActionTaskId { get; set; }

    public Guid? AttachmentId { get; set; }

    public string FileName { get; set; } = null!;

    public string? FileUrl { get; set; }

    public DateTime UploadedAt { get; set; }

    public string UploadedBy { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public bool IsActived { get; set; }

    public bool IsDeleted { get; set; }

    public double FileSize { get; set; }

    public string FileExtension { get; set; } = null!;

    public virtual ActionTask ActionTask { get; set; } = null!;
}
