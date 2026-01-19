using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Requests
{
    public class CriterionRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public Guid StandardId { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Guidance { get; set; } = null!;
    }

    public class CriterionRequestValidator : AbstractValidator<CriterionRequest>
    {
        public CriterionRequestValidator()
        {
            RuleFor(x => x.StandardId)
                .NotEmpty().WithMessage("Tiêu chuẩn không được để trống");
            
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã tiêu chí không được để trống");
            
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên tiêu chí không được để trống");
            
            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Mô tả không được để trống");
            
            RuleFor(x => x.Guidance)
                .NotEmpty().WithMessage("Hướng dẫn không được để trống");
        }
    }
}
