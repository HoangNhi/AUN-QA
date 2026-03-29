using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests
{
    public class SurveyCampaignRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid? CycleId { get; set; }

        public Guid? TemplateId { get; set; }

        public int? StakeholderType { get; set; }

        public string Name { get; set; } = null!;

        /// <summary>
        /// 1. Chưa gửi, 2. Đã gửi, 3. Đã hoàn thành
        /// </summary>
        public int? Status { get; set; } = ((int)SurveyCampaignStatus.Draft);

        public List<TemplateTopicRequest> ListTopic { get; set; } = new();
    }

    public class SurveyCampaignRequestValidator : AbstractValidator<SurveyCampaignRequest>
    {
        public SurveyCampaignRequestValidator()
        {
            RuleFor(x => x.CycleId)
                .NotEmpty().WithMessage("Chu kỳ khảo sát không được để trống");

            RuleFor(x => x.TemplateId)
                .NotEmpty().WithMessage("Mẫu khảo sát không được để trống");

            RuleFor(x => x.StakeholderType)
                .NotEmpty().WithMessage("Loại đối tượng tham gia không được để trống");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên chiến dịch khảo sát không được để trống");

            RuleForEach(x => x.ListTopic)
                .SetValidator(new TemplateTopicRequestValidator());
        }
    }
}
