using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests
{
    public class StandardRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string AunVersion { get; set; } = null!;
    }

    public class StandardRequestValidator : AbstractValidator<StandardRequest>
    {
        public StandardRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã tiêu chuẩn không được để trống");
            
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên tiêu chuẩn không được để trống");
            
            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Mô tả không được để trống");
            
            RuleFor(x => x.AunVersion)
                .NotEmpty().WithMessage("Phiên bản AUN-QA không được để trống");
        }
    }
}
