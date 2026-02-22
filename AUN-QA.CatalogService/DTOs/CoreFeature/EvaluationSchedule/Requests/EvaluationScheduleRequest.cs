using AUN_QA.Shared.DTOs.Base;
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
            RuleFor(x => x.CycleId).NotEmpty().WithMessage("Chu ká»³ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.ActivityName).NotEmpty().WithMessage("TÃªn hoáº¡t Ä‘á»™ng khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.StartTime).NotEmpty().WithMessage("Thá»i gian báº¯t Ä‘áº§u khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.EndTime).NotEmpty().WithMessage("Thá»i gian káº¿t thÃºc khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.LeadId).NotEmpty().WithMessage("NgÆ°á»i phá»¥ trÃ¡ch khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }
}
