using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Council.Requests
{
    public class CouncilRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public Guid CycleId { get; set; }
        public Guid UserId { get; set; }
        public bool IsLeader { get; set; } = false;
    }

    public class CouncilRequestValidator : AbstractValidator<CouncilRequest>
    {
        public CouncilRequestValidator()
        {
            RuleFor(x => x.CycleId).NotEmpty().WithMessage("Hội đồng không được để trống");
            RuleFor(x => x.UserId).NotEmpty().WithMessage("Thành viên hội đồng không được để trống");
        }
    }
}
