using AUN_QA.Shared.DTOs.Base;
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

        public Guid StandardSetId { get; set; }

        public List<CouncilRequest> ListCouncil { get; set; } = new();

        public List<EvaluationScheduleRequest> ListEvaluationSchedule { get; set; } = new();
    }

    public class CycleRequestValidator : AbstractValidator<CycleRequest>
    {
        public CycleRequestValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Káº¿ hoáº¡ch khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Year).NotEmpty().WithMessage("NÄƒm khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.StartDate).NotEmpty().WithMessage("NgÃ y báº¯t Ä‘áº§u khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.EndDate).NotEmpty().WithMessage("NgÃ y káº¿t thÃºc khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Status).NotEmpty().WithMessage("Tráº¡ng thÃ¡i khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.EvaluationPurpose).NotEmpty().WithMessage("Má»¥c Ä‘Ã­ch Ä‘Ã¡nh giÃ¡ khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Scope).NotEmpty().WithMessage("Pháº¡m vi khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");

            RuleForEach(x => x.ListCouncil).SetValidator(new CouncilRequestValidator());
            RuleForEach(x => x.ListEvaluationSchedule).SetValidator(new EvaluationScheduleRequestValidator());

            RuleFor(x => x.EndDate)
                .GreaterThan(x => x.StartDate)
                .WithMessage("NgÃ y káº¿t thÃºc pháº£i lá»›n hÆ¡n ngÃ y báº¯t Ä‘áº§u");

            RuleFor(x => x.Year)
                .InclusiveBetween(2000, 2100)
                .WithMessage("NÄƒm pháº£i náº±m trong khoáº£ng tá»« 2000 Ä‘áº¿n 2100");

            RuleFor(x => x.StandardSetId)
                .NotEqual(Guid.Empty)
                .WithMessage("Bá»™ tiÃªu chuáº©n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }
}
