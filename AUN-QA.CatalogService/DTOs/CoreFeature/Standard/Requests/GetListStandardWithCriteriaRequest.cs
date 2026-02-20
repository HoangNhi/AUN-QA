using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Requests
{
    public class GetListStandardWithCriteriaRequest
    {
        public Guid CycleId { get; set; }
        public Guid? StandardSetId { get; set; }
        public Guid? FileTypeId { get; set; }
    }

    public class GetListStandardWithCriteriaRequestValidator : AbstractValidator<GetListStandardWithCriteriaRequest>
    {
        public GetListStandardWithCriteriaRequestValidator()
        {
            RuleFor(x => x)
                .Must(x => x.CycleId != Guid.Empty || (x.StandardSetId.HasValue && x.StandardSetId.Value != Guid.Empty))
                .WithMessage("Phai cung cap CycleId hoac StandardSetId");
        }
    }
}
