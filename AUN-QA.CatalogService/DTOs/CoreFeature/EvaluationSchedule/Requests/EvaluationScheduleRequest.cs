using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Requests
{
    public class EvaluationScheduleRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public string ActivityName { get; set; } = null!;

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public Guid LeadId { get; set; }
    }

    public class EvaluationScheduleRequestValidator : AbstractValidator<EvaluationScheduleRequest>
    {
        public EvaluationScheduleRequestValidator()
        {
            RuleFor(x => x.CycleId).NotEmpty().WithMessage("Chu kỳ không được để trống");
            RuleFor(x => x.ActivityName).NotEmpty().WithMessage("Tên hoạt động không được để trống");
            RuleFor(x => x.StartTime).NotEmpty().WithMessage("Thời gian bắt đầu không được để trống");
            RuleFor(x => x.EndTime).NotEmpty().WithMessage("Thời gian kết thúc không được để trống");
            RuleFor(x => x.LeadId).NotEmpty().WithMessage("Người phụ trách không được để trống");
        }
    }
}
