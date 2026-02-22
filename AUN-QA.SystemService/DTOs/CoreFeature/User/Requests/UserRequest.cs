using AUN_QA.Shared.DTOs.Base;
using AUN_QA.SystemService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.SystemService.DTOs.CoreFeature.User.Requests
{
    public class UserRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string Username { get; set; } = null!;

        public string Fullname { get; set; } = null!;

        public string Password { get; set; } = null!;

        public Guid RoleId { get; set; }

        public string Email { get; set; } = null!;

        public string? Avatar { get; set; }
    }

    public class UserRequestValidator : AbstractValidator<UserRequest>
    {
        public UserRequestValidator()
        {
            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("TÃªn tÃ i khoáº£n khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Fullname)
                .NotEmpty().WithMessage("Há» vÃ  tÃªn khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Máº­t kháº©u khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.RoleId)
                .NotEmpty().WithMessage("Vai trÃ² khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
                .EmailAddress().WithMessage("Email khÃ´ng há»£p lá»‡");
        }
    }
}
