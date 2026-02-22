using AUN_QA.Shared.DTOs.Base;
using AUN_QA.CatalogService.DTOs.Base;
using FluentValidation;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests
{
    public class FileTypeRequest : BaseRequest
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }

    public class FileTypeRequestValidator : AbstractValidator<FileTypeRequest>
    {
        public FileTypeRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("TÃƒÂªn loÃ¡ÂºÂ¡i tÃ¡Â»â€¡p khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c Ã„â€˜Ã¡Â»Æ’ trÃ¡Â»â€˜ng");
        }
    }
}
