using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Requests
{
    public class EvidenceCycleMapRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public string Code { get; set; } = null!;

        /// <summary>
        /// 1. Draft, 2. Pending, 3. Verified, 4. Rejected
        /// </summary>
        public int Status { get; set; } = 0;

        public DateTime? IssueDate { get; set; }

        public string? IssuingAuthority { get; set; }

        public DateTime? ExpiryDate { get; set; }

        public Guid FileTypeId { get; set; }

        public string? RejectionReason { get; set; }

        public string? Description { get; set; }

        public Guid CycleId { get; set; }

        #region Attachment
        public List<Guid> AttachmentIds { get; set; } = new List<Guid>();

        public List<ModelAttachment> ListAttachment { get; set; } = new List<ModelAttachment>();
        #endregion
    }

    public class EvidenceCycleMapRequestValidator : AbstractValidator<EvidenceCycleMapRequest>
    {
        public EvidenceCycleMapRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên không được để trống");

            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã không được để trống");

            RuleFor(x => x.FileTypeId)
                .NotEmpty().WithMessage("Loại tài liệu không được để trống");

            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("Chu kỳ không được để trống");
        }
    }
}
