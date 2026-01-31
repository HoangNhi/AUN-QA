using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Requests
{
    public class StandardSetRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class StandardSetRequestValidator : AbstractValidator<StandardSetRequest>
    {
        public StandardSetRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã bộ tiêu chuẩn không được để trống");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên bộ tiêu chuẩn không được để trống");
        }
    }
}
