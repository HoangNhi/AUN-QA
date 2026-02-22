using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.SystemService.DTOs.CoreFeature.User.Requests
{
    public class EditProfileRequest : BaseRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? Avatar { get; set; }
    }

    public class EditProfileRequestValidator : AbstractValidator<EditProfileRequest>
    {
        public EditProfileRequestValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng.")
                .EmailAddress().WithMessage("Email khÃ´ng Ä‘Ãºng Ä‘á»‹nh dáº¡ng.");
        }
    }
}
