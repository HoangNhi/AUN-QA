using FluentValidation;

namespace AUN_QA.BusinessService.DTOs.Base
{
    public class SubmitForReviewRequest
    {
        public List<Guid> Ids { get; set; }
    }

    public class SubmitForReviewRequestValidator : AbstractValidator<SubmitForReviewRequest>
    {
        public SubmitForReviewRequestValidator()
        {
            RuleFor(x => x.Ids)
                .NotEmpty().WithMessage("Danh sách dữ liệu không được để trống");
        }
    }
}
