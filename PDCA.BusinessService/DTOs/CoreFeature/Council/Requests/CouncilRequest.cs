using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.Council.Requests
{
    public class CouncilRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid CycleId { get; set; }

        public Guid? UserId { get; set; }

        /// <summary>
        /// 1=Chủ tịch HĐ, 2=Phó CT HĐ, 3=Thư ký, 4=Thành viên ĐG, 5=Người cung cấp MC
        /// </summary>
        public int RoleId { get; set; } = 4;  // default: Thành viên ĐG
        public List<Guid> AssignedStandardIds { get; set; } = new();
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
