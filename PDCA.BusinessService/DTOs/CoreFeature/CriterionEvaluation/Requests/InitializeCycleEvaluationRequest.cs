using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.CriterionEvaluation.Requests
{
    public class InitializeCycleEvaluationRequest
    {
        public Guid CycleId { get; set; }
        public Guid StandardSetId { get; set; }
    }

    public class InitializeCycleEvaluationRequestValidator : AbstractValidator<InitializeCycleEvaluationRequest>
    {
        public InitializeCycleEvaluationRequestValidator()
        {
            RuleFor(x => x.CycleId).NotEmpty().WithMessage("Chu kỳ không được để trống");
            RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Bộ tiêu chuẩn không được để trống");
        }
    }
}
