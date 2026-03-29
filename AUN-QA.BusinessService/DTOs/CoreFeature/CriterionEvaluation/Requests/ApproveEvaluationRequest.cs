using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests
{
    public class ApproveEvaluationRequest
    {
        public Guid CriterionEvaluationId { get; set; }
        public int? OfficialScore { get; set; }
        public bool? OfficialResult { get; set; }
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
        }
    }
}
