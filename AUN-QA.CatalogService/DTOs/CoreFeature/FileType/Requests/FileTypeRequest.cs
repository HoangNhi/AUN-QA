using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests
{
    public class FileTypeRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class FileTypeRequestValidator : AbstractValidator<FileTypeRequest>
    {
        public FileTypeRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã loại tệp không được để trống");
            
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên loại tệp không được để trống");
        }
    }
}
