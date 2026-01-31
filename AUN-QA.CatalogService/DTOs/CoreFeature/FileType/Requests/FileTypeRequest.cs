using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests
{
    public class FileTypeRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Decription { get; set; }
    }

    public class FileTypeRequestValidator : AbstractValidator<FileTypeRequest>
    {
        public FileTypeRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên loại tệp không được để trống");
        }
    }
}
