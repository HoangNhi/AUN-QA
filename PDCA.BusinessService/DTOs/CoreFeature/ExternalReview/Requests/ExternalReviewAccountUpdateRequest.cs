using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests
{
    public class ExternalReviewAccountUpdateRequest
    {
        public Guid AccountId { get; set; }
        public string Fullname { get; set; } = null!;
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public bool IsActived { get; set; } = true;
        public string? Password { get; set; }
    }

    public class ExternalReviewAccountUpdateRequestValidator
        : AbstractValidator<ExternalReviewAccountUpdateRequest>
    {
        public ExternalReviewAccountUpdateRequestValidator()
        {
            RuleFor(x => x.AccountId).NotEmpty();
            RuleFor(x => x.Fullname).NotEmpty().WithMessage("Họ tên không được để trống.");
            RuleFor(x => x.Username).NotEmpty().WithMessage("Tên tài khoản không được để trống.");
            RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Email không hợp lệ.");
        }
    }
}
