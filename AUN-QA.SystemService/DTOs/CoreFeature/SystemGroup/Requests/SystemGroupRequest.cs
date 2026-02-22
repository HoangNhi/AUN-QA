using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.SystemService.DTOs.CoreFeature.SystemGroup.Requests
{
    public class SystemGroupRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public new int Sort { get; set; }

        public Guid? Parentid { get; set; }
    }

    public class SystemGroupRequestValidator : AbstractValidator<SystemGroupRequest>
    {
        public SystemGroupRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("TÃƒÂªn nhÃƒÂ³m khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");
        }
    }
}
