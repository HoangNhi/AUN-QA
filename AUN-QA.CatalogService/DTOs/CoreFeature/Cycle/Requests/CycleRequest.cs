using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Council.Requests;
using AUN_QA.CatalogService.DTOs.CoreFeature.EvaluationSchedule.Requests;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Requests
{
    public class CycleRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public int Year { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        // 1: Plan, 2: On going, 3: Close
        public int Status { get; set; } = 1;

        public string EvaluationPurpose { get; set; } = null!;

        public int Scope { get; set; }

        public List<CouncilRequest> ListCouncil { get; set; } = new();

        public List<EvaluationScheduleRequest> ListEvaluationSchedule { get; set; } = new();
    }

    public class CycleRequestValidator : AbstractValidator<CycleRequest>
    {
        public CycleRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Tên chu kỳ không được để trống");
            RuleFor(x => x.Year).NotEmpty().WithMessage("Năm không được để trống");
            RuleFor(x => x.StartDate).NotEmpty().WithMessage("Ngày bắt đầu không được để trống");
            RuleFor(x => x.EndDate).NotEmpty().WithMessage("Ngày kết thúc không được để trống");
            RuleFor(x => x.Status).NotEmpty().WithMessage("Trạng thái không được để trống");
            RuleFor(x => x.EvaluationPurpose).NotEmpty().WithMessage("Mục đích đánh giá không được để trống");
            RuleFor(x => x.Scope).NotEmpty().WithMessage("Phạm vi không được để trống");

            RuleForEach(x => x.ListCouncil).SetValidator(new CouncilRequestValidator());
            RuleForEach(x => x.ListEvaluationSchedule).SetValidator(new EvaluationScheduleRequestValidator());
        }
    }
}
