using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests
{
    public class EvaluationSubmissionRequest
    {
        public Guid Id { get; set; }
        public Guid CriterionEvaluationId { get; set; }
        public string? CurrentState { get; set; }
        public string? Strengths { get; set; }
        public string? Weaknesses { get; set; }
        public string? ActionPlan { get; set; }
        public int? ProposedScore { get; set; }
        public bool? ProposedResult { get; set; }
    }

    public class EvaluationSubmissionRequestValidator : AbstractValidator<EvaluationSubmissionRequest>
    {
        public EvaluationSubmissionRequestValidator()
        {
            RuleFor(x => x.CriterionEvaluationId)
                .NotEmpty().WithMessage("Tiêu chí đánh giá không được để trống");

            RuleFor(x => x.CurrentState)
                .NotEmpty().WithMessage("Vui lòng nhập mô tả thực trạng");

            RuleFor(x => x.Strengths)
                .NotEmpty().WithMessage("Vui lòng nhập điểm mạnh");

            RuleFor(x => x.Weaknesses)
                .NotEmpty().WithMessage("Vui lòng nhập điểm tồn tại / Gap");

            RuleFor(x => x.ActionPlan)
                .NotEmpty().WithMessage("Vui lòng nhập đề xuất kế hoạch hành động");
        }
    }
}
