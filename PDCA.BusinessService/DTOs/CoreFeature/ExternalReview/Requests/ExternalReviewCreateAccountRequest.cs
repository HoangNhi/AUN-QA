using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewCreateAccountRequest
    {
        public string Fullname { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class ExternalReviewCreateAccountRequestValidator : AbstractValidator<ExternalReviewCreateAccountRequest>
    {
        public ExternalReviewCreateAccountRequestValidator()
        {
            RuleFor(x => x.Fullname).NotEmpty().WithMessage("Họ tên không được để trống.");
            RuleFor(x => x.Username).NotEmpty().WithMessage("Tên tài khoản không được để trống.");
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Email không hợp lệ.");
            RuleFor(x => x.Password).NotEmpty().WithMessage("Mật khẩu không được để trống.");
        }
    }
}
