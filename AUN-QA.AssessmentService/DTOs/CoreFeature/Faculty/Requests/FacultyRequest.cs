using AUN_QA.AssessmentService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.AssessmentService.DTOs.CoreFeature.Faculty.Requests
{
    public class FacultyRequest : BaseRequests
    {
        public Guid Id { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }
    }

    public class FacultyRequestValidator : AbstractValidator<FacultyRequest>
    {
        public FacultyRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã khoa không được để trống");
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên khoa không được để trống");
        }
    }
}
