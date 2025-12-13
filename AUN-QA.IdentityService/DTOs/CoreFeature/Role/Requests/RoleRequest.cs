using AUN_QA.IdentityService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.IdentityService.DTOs.CoreFeature.Role.Requests
{
    public class RoleRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;
    }

    public class RoleRequestValidator : AbstractValidator<RoleRequest>
    {
        public RoleRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên gọi không được để trống");
        }
    }
}
