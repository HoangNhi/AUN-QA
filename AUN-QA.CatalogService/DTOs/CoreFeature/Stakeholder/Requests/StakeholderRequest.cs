using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Stakeholder.Requests
{
    public class StakeholderRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public string FullName { get; set; } = null!;

        public string Email { get; set; } = null!;

        /// <summary>
        /// 1. Sinh viÃƒÂªn, 2. CÃ¡Â»Â±u sinh viÃƒÂªn, 3. NhÃƒÂ  tuyÃ¡Â»Æ’n dÃ¡Â»Â¥ng, 4. GiÃ¡ÂºÂ£ng viÃƒÂªn
        /// </summary>
        public int? Type { get; set; }

        public string? Description { get; set; }
    }

    public class StakeholderRequestValidator : AbstractValidator<StakeholderRequest>
    {
        public StakeholderRequestValidator()
        {
            RuleFor(x => x.FullName).NotEmpty().WithMessage("HÃ¡Â»Â tÃƒÂªn khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng")
                .EmailAddress().WithMessage("Email khÃƒÂ´ng Ã„â€˜ÃƒÂºng Ã„â€˜Ã¡Â»â€¹nh dÃ¡ÂºÂ¡ng");
            RuleFor(x => x.Type).NotEmpty().WithMessage("LoÃ¡ÂºÂ¡i Ã„â€˜Ã¡Â»â€˜i tÃ†Â°Ã¡Â»Â£ng khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");
        }
    }
}
