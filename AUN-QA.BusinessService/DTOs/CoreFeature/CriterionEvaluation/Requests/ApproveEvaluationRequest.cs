using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests
{
    public class ApproveEvaluationRequest
    {
        public Guid CriterionEvaluationId { get; set; }
        public int? OfficialScore { get; set; }
        public bool? OfficialResult { get; set; }
        public string? OfficialCurrentState { get; set; }
        public string? OfficialStrengths { get; set; }
        public string? OfficialWeaknesses { get; set; }
        public string? OfficialActionPlan { get; set; }
    }

    public class ApproveEvaluationRequestValidator : AbstractValidator<ApproveEvaluationRequest>
    {
        public ApproveEvaluationRequestValidator()
        {
            RuleFor(x => x.CriterionEvaluationId)
                .NotEmpty().WithMessage("Tiêu chí đánh giá không được để trống");

            RuleFor(x => x)
                .Must(x => x.OfficialScore.HasValue || x.OfficialResult.HasValue)
                .WithMessage("Phải có điểm chốt (AUN) hoặc kết quả chốt (MOET)");

            RuleFor(x => x.OfficialCurrentState)
                .NotEmpty().WithMessage("Vui lòng nhập mô tả thực trạng chốt");

            RuleFor(x => x.OfficialStrengths)
                .NotEmpty().WithMessage("Vui lòng nhập điểm mạnh chốt");

            RuleFor(x => x.OfficialWeaknesses)
                .NotEmpty().WithMessage("Vui lòng nhập điểm tồn tại chốt");

            RuleFor(x => x.OfficialActionPlan)
                .NotEmpty().WithMessage("Vui lòng nhập kế hoạch cải tiến chốt");
        }
    }
}
