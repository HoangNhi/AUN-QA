using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Standard.CriterionRequirement.Requests;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Requests
{
    public class CriterionRequest : BaseRequest
    {
        public Guid Id { get; set; }

        public Guid StandardId { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int Order { get; set; }

        #region GetList
        public string? FileType { get; set; }
        #endregion

        public List<CriterionRequirementRequest> CriterionRequirements { get; set; } = new();
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

            RuleFor(x => x.Order)
                .GreaterThanOrEqualTo(0).WithMessage("Thứ tự phải lớn hơn hoặc bằng 0");

            RuleForEach(x => x.CriterionRequirements).SetValidator(new CriterionRequirementRequestValidator());
        }
    }
}
