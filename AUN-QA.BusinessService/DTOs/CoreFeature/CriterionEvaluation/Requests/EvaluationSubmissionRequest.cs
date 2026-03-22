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
        }
    }
}
