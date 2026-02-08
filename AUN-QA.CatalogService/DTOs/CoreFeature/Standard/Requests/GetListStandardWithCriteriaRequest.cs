using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests
{
    public class GetListStandardWithCriteriaRequest
    {
        public Guid CycleId { get; set; }
        public Guid FileTypeId { get; set; }
    }

    public class GetListStandardWithCriteriaRequestValidator : AbstractValidator<GetListStandardWithCriteriaRequest>
    {
        public GetListStandardWithCriteriaRequestValidator()
        {
            RuleFor(x => x.CycleId).NotEmpty().WithMessage("Chu ky khong duoc de trong");
            RuleFor(x => x.FileTypeId).NotEmpty().WithMessage("Loai tai lieu khong duoc de trong");
        }
    }
}
